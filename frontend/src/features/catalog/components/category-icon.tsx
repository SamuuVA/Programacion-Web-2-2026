import {
  DownloadIcon,
  HeadphonesIcon,
  HouseIcon,
  ShirtIcon,
  type IconProps
} from "@/components/icons";
import type { CategoriaProducto } from "../types";

const ICONS = {
  ELECTRONICA: HeadphonesIcon,
  ROPA: ShirtIcon,
  HOGAR: HouseIcon,
  DIGITAL: DownloadIcon
} as const;

export function CategoryIcon({
  categoria,
  ...props
}: IconProps & { categoria: CategoriaProducto }) {
  const Component = ICONS[categoria];
  return <Component {...props} />;
}
