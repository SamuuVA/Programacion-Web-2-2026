import type { Clock } from "../application/ports.js";
import { Instant } from "../domain/value-objects.js";

export class SystemClock implements Clock {
  now(): Instant {
    return Instant.fromDate(new Date());
  }
}
