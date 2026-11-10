import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

/**
 * Validación reproducible del contrato OpenAPI sin dependencias externas.
 * Cubre sintaxis YAML, estructura 3.1, referencias locales, parámetros de ruta,
 * operationIds únicos, respuestas, seguridad y coherencia básica de esquemas.
 * No sustituye a un validador completo, pero corre offline y en CI.
 */

type JsonObject = Record<string, unknown>;

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace"
]);

const SCHEMA_TYPES = new Set([
  "null",
  "boolean",
  "object",
  "array",
  "number",
  "integer",
  "string"
]);

const here = dirname(fileURLToPath(import.meta.url));
const openApiPath = resolve(here, "..", "openapi.yaml");

const issues: string[] = [];

function fail(message: string): void {
  issues.push(message);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs);
    }
    return refs;
  }
  if (!isObject(value)) {
    return refs;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "$ref" && typeof child === "string") {
      refs.push(child);
    } else {
      collectRefs(child, refs);
    }
  }
  return refs;
}

function resolvePointer(document: unknown, ref: string): unknown {
  if (ref === "#") {
    return document;
  }
  if (!ref.startsWith("#/")) {
    return undefined;
  }

  let current: unknown = document;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = decodeURIComponent(rawSegment)
      .replace(/~1/g, "/")
      .replace(/~0/g, "~");
    if (!isObject(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function dereference(document: unknown, value: unknown): unknown {
  let current = value;
  const seen = new Set<string>();
  while (isObject(current) && typeof current.$ref === "string") {
    if (seen.has(current.$ref)) {
      return undefined;
    }
    seen.add(current.$ref);
    current = resolvePointer(document, current.$ref);
  }
  return current;
}

function checkSchema(schema: unknown, location: string): void {
  if (!isObject(schema)) {
    return;
  }

  if (typeof schema.type === "string" && !SCHEMA_TYPES.has(schema.type)) {
    fail(`${location}: tipo desconocido "${schema.type}"`);
  }
  if (Array.isArray(schema.type)) {
    for (const type of schema.type) {
      if (typeof type !== "string" || !SCHEMA_TYPES.has(type)) {
        fail(`${location}: tipo desconocido en la lista de tipos`);
      }
    }
  }

  if (Array.isArray(schema.enum) && schema.enum.length === 0) {
    fail(`${location}: enum vacío`);
  }

  if (isObject(schema.properties)) {
    const properties = schema.properties;
    if (Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (typeof required === "string" && !(required in properties)) {
          fail(`${location}: required "${required}" no existe en properties`);
        }
      }
    }
    for (const [name, property] of Object.entries(properties)) {
      checkSchema(property, `${location}.properties.${name}`);
    }
  }

  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    const list = schema[keyword];
    if (Array.isArray(list)) {
      list.forEach((entry, index) =>
        checkSchema(entry, `${location}.${keyword}[${index}]`)
      );
    }
  }

  if (schema.items !== undefined) {
    checkSchema(schema.items, `${location}.items`);
  }
  if (isObject(schema.additionalProperties)) {
    checkSchema(
      schema.additionalProperties,
      `${location}.additionalProperties`
    );
  }

  const minimum = schema.minimum;
  const maximum = schema.maximum;
  if (
    typeof minimum === "number" &&
    typeof maximum === "number" &&
    minimum > maximum
  ) {
    fail(`${location}: minimum es mayor que maximum`);
  }
  const minLength = schema.minLength;
  const maxLength = schema.maxLength;
  if (
    typeof minLength === "number" &&
    typeof maxLength === "number" &&
    minLength > maxLength
  ) {
    fail(`${location}: minLength es mayor que maxLength`);
  }
}

function checkParameters(
  document: unknown,
  parameters: unknown,
  location: string,
  expectedPathParameters: ReadonlySet<string>
): ReadonlySet<string> {
  const declared = new Set<string>();
  if (parameters === undefined) {
    return declared;
  }
  if (!Array.isArray(parameters)) {
    fail(`${location}: parameters debe ser una lista`);
    return declared;
  }

  for (const [index, rawParameter] of parameters.entries()) {
    const parameter = dereference(document, rawParameter);
    if (!isObject(parameter)) {
      fail(`${location}.parameters[${index}]: parámetro inválido`);
      continue;
    }
    if (typeof parameter.name !== "string" || parameter.name.length === 0) {
      fail(`${location}.parameters[${index}]: falta name`);
      continue;
    }
    if (typeof parameter.in !== "string") {
      fail(`${location}.parameters[${index}]: falta in`);
      continue;
    }
    if (parameter.in === "path") {
      declared.add(parameter.name);
      if (parameter.required !== true) {
        fail(
          `${location}.parameters[${index}]: los parámetros de ruta deben ser required`
        );
      }
      if (!expectedPathParameters.has(parameter.name)) {
        fail(
          `${location}.parameters[${index}]: "${parameter.name}" no aparece en la plantilla de ruta`
        );
      }
    }
  }

  return declared;
}

async function main(): Promise<void> {
  let source: string;
  try {
    source = await readFile(openApiPath, "utf8");
  } catch {
    console.error(`No se pudo leer ${openApiPath}`);
    process.exit(1);
  }

  let document: unknown;
  try {
    document = parse(source);
  } catch (error) {
    console.error(
      "YAML inválido:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  if (!isObject(document)) {
    console.error("El documento OpenAPI no es un objeto.");
    process.exit(1);
  }

  if (
    typeof document.openapi !== "string" ||
    !/^3\.1\.\d+$/.test(document.openapi)
  ) {
    fail(
      `openapi debe ser una versión 3.1.x, recibido: ${String(document.openapi)}`
    );
  }

  const info = document.info;
  if (!isObject(info)) {
    fail("falta info");
  } else {
    if (typeof info.title !== "string" || info.title.length === 0) {
      fail("info.title es obligatorio");
    }
    if (typeof info.version !== "string" || info.version.length === 0) {
      fail("info.version es obligatorio");
    }
  }

  const paths = document.paths;
  if (!isObject(paths) || Object.keys(paths).length === 0) {
    fail("paths debe declarar al menos una ruta");
  }

  const components = isObject(document.components) ? document.components : {};
  const securitySchemes = isObject(components.securitySchemes)
    ? components.securitySchemes
    : {};

  const operationIds = new Set<string>();
  let operationCount = 0;

  if (isObject(paths)) {
    for (const [path, pathItem] of Object.entries(paths)) {
      if (!path.startsWith("/")) {
        fail(`La ruta "${path}" debe empezar con /`);
      }
      if (!isObject(pathItem)) {
        fail(`La ruta "${path}" no es un objeto`);
        continue;
      }

      const templateParameters = new Set(
        Array.from(path.matchAll(/\{([^}]+)\}/g), (match) => match[1] ?? "")
      );
      const pathParameters = checkParameters(
        document,
        pathItem.parameters,
        `paths.${path}`,
        templateParameters
      );

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.has(method)) {
          continue;
        }
        operationCount += 1;
        const location = `paths.${path}.${method}`;
        if (!isObject(operation)) {
          fail(`${location}: operación inválida`);
          continue;
        }

        const operationId = operation.operationId;
        if (typeof operationId !== "string" || operationId.length === 0) {
          fail(`${location}: falta operationId`);
        } else if (operationIds.has(operationId)) {
          fail(`${location}: operationId duplicado "${operationId}"`);
        } else {
          operationIds.add(operationId);
        }

        const responses = operation.responses;
        if (!isObject(responses) || Object.keys(responses).length === 0) {
          fail(`${location}: debe declarar responses`);
        } else {
          for (const [status, rawResponse] of Object.entries(responses)) {
            const response = dereference(document, rawResponse);
            if (!isObject(response)) {
              fail(`${location}.responses.${status}: respuesta inválida`);
              continue;
            }
            if (
              typeof response.description !== "string" ||
              response.description.length === 0
            ) {
              fail(`${location}.responses.${status}: falta description`);
            }
            if (isObject(response.content)) {
              for (const [mediaType, media] of Object.entries(
                response.content
              )) {
                if (!isObject(media)) {
                  fail(
                    `${location}.responses.${status}.content.${mediaType}: media inválida`
                  );
                  continue;
                }
                checkSchema(
                  media.schema,
                  `${location}.responses.${status}.content.${mediaType}.schema`
                );
              }
            }
          }
        }

        const declaredParameters = checkParameters(
          document,
          operation.parameters,
          location,
          templateParameters
        );
        const allDeclared = new Set([...pathParameters, ...declaredParameters]);
        for (const parameter of templateParameters) {
          if (!allDeclared.has(parameter)) {
            fail(
              `${location}: falta declarar el parámetro de ruta "${parameter}"`
            );
          }
        }

        const requestBody = dereference(document, operation.requestBody);
        if (isObject(requestBody) && isObject(requestBody.content)) {
          for (const [mediaType, media] of Object.entries(
            requestBody.content
          )) {
            if (isObject(media)) {
              checkSchema(
                media.schema,
                `${location}.requestBody.${mediaType}.schema`
              );
            }
          }
        }

        if (Array.isArray(operation.security)) {
          for (const requirement of operation.security) {
            if (!isObject(requirement)) {
              fail(`${location}.security: requisito inválido`);
              continue;
            }
            for (const scheme of Object.keys(requirement)) {
              if (!(scheme in securitySchemes)) {
                fail(`${location}.security: esquema desconocido "${scheme}"`);
              }
            }
          }
        }
      }
    }
  }

  if (isObject(components.schemas)) {
    for (const [name, schema] of Object.entries(components.schemas)) {
      checkSchema(schema, `components.schemas.${name}`);
    }
  }

  const refs = collectRefs(document);
  for (const ref of refs) {
    if (!ref.startsWith("#/")) {
      fail(`Referencia externa no permitida en este contrato: ${ref}`);
      continue;
    }
    if (resolvePointer(document, ref) === undefined) {
      fail(`Referencia sin resolver: ${ref}`);
    }
  }

  if (operationCount === 0) {
    fail("No se encontró ninguna operación HTTP");
  }

  if (issues.length > 0) {
    console.error(`OpenAPI inválido (${issues.length} problema(s)):`);
    for (const issue of issues) {
      console.error(` - ${issue}`);
    }
    process.exit(1);
  }

  console.log(
    `OpenAPI válido: ${Object.keys(paths as JsonObject).length} rutas, ` +
      `${operationCount} operaciones, ${refs.length} referencias.`
  );
}

await main();
