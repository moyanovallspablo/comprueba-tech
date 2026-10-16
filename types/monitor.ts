export type PanelType = "IPS" | "IPS Black" | "Fast IPS" | "VA" | "QD-OLED";

export type AspectRatio = "16:9" | "21:9" | "32:9";

export type HdrLevel =
  | "Ninguno"
  | "HDR10"
  | "DisplayHDR 400"
  | "DisplayHDR True Black 400";

export type AdaptiveSync =
  | "Ninguno"
  | "FreeSync"
  | "FreeSync Premium"
  | "FreeSync Premium Pro"
  | "G-Sync Compatible";

export type StandType = "peana" | "brazo-abrazadera";

export type FrictionLevel = "baja" | "media" | "alta";

export interface FrictionNote {
  nivel: FrictionLevel;
  nota: string;
}

/** Valoración editorial del uso diario: lo que no sale en la ficha técnica. */
export interface DailyFriction {
  peana: FrictionNote;
  puertos: FrictionNote;
  osd: FrictionNote;
  despertar: FrictionNote;
}

export interface Monitor {
  id: string;
  marca: string;
  modelo: string;

  // Precio (EUR, mercado español, orientativo)
  precio_eur: number;
  precio_minimo_historico_eur: number;
  precio_lanzamiento_eur: number;
  fecha_lanzamiento: string; // "YYYY-MM"
  meses_mercado: number;

  // Panel e imagen
  pulgadas: number;
  resolucion: { ancho: number; alto: number };
  relacion_aspecto: AspectRatio;
  curvatura: number | null; // radio en mm (1800R → 1800); null si es plano
  panel: PanelType;
  hz: number;
  tiempo_respuesta_ms: number; // GtG según fabricante
  brillo_nits: number; // SDR típico
  hdr: HdrLevel;
  cobertura_srgb: number; // %
  cobertura_dci_p3: number; // %
  calibrado_fabrica: boolean;
  adaptive_sync: AdaptiveSync;

  // Conectividad
  usbC: boolean; // USB-C con DisplayPort Alt Mode / Thunderbolt
  usbC_PD_watts: number; // 0 si no hay carga por USB-C
  thunderbolt: boolean;
  kvm: boolean;
  hub_usb_puertos: number; // puertos USB de bajada
  ethernet: boolean;
  daisy_chain: boolean;
  altavoces: boolean;
  webcam: boolean;

  // Ergonomía y espacio
  ergonomia: {
    altura_mm: number; // recorrido de ajuste en altura (0 = fijo)
    inclinacion: boolean;
    giro: boolean; // swivel
    pivote: boolean; // rotación a vertical
  };
  vesa: boolean;
  tipo_soporte: StandType;
  peana_profundidad_cm: number; // fondo total que ocupa en la mesa (peana + panel)
  ancho_cm: number;

  consumo_tipico_w: number;
  garantia_anios: number;
  friccion_diaria: DailyFriction;
  imageUrl: string; // ruta en /public (/monitors/<id>.webp) o URL de un dominio en images.remotePatterns; si no carga se dibuja una ilustración a escala
  afiliado_url?: string; // sobrescribe el enlace de compra por defecto
  notas?: string;
}

export type Profile = "mac" | "gaming" | "oficina";

export type GpuTier = "integrada" | "media" | "alta";

export interface CurrentEquipment {
  dispositivo: "portatil" | "sobremesa";
  gpu: GpuTier;
  profundidad_mesa_cm?: number;
  ancho_mesa_cm?: number;
  monitor_actual?: {
    pulgadas: number;
    resolucion_alto: number; // 1080, 1440, 2160…
    hz: number;
  };
}
