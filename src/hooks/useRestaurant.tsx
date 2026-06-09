import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SHELF,
  DEFAULT_SINK,
  DEFAULT_STEEL,
  type ShelfSettings,
  type SinkSettings,
  type SteelTableSettings,
} from "@/lib/restaurant-calc";

export interface ProjectType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  active: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  manufacturer: string | null;
  country_of_origin: string | null;
  description: string | null;
  image_url: string | null;
  brand_logo_url: string | null;
  category: string | null;
  price_new: number;
  price_used: number;
  project_type_slugs: string[];
  active: boolean;
  sort_order: number;
}

const db = supabase as any;

/** أنواع المشاريع المفعّلة مرتبة */
export function useProjectTypes() {
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    db.from("restaurant_project_types")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }: any) => {
        if (!on) return;
        setTypes((data ?? []) as ProjectType[]);
        setLoading(false);
      });
    return () => {
      on = false;
    };
  }, []);
  return { types, loading };
}

/** معدات المشروع (كل المعدات المفعّلة) */
export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    db.from("restaurant_equipment")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }: any) => {
        if (!on) return;
        setEquipment(
          (data ?? []).map((d: any) => ({
            ...d,
            price_new: Number(d.price_new ?? 0),
            price_used: Number(d.price_used ?? 0),
            project_type_slugs: d.project_type_slugs ?? [],
          })) as Equipment[],
        );
        setLoading(false);
      });
    return () => {
      on = false;
    };
  }, []);
  return { equipment, loading };
}

/** إعدادات الحاسبات من قاعدة البيانات مع قيم افتراضية */
export function useCalcSettings() {
  const [steel, setSteel] = useState<SteelTableSettings>(DEFAULT_STEEL);
  const [sink, setSink] = useState<SinkSettings>(DEFAULT_SINK);
  const [shelf, setShelf] = useState<ShelfSettings>(DEFAULT_SHELF);
  useEffect(() => {
    let on = true;
    db.from("restaurant_calc_settings")
      .select("key,value")
      .then(({ data }: any) => {
        if (!on || !data) return;
        for (const row of data) {
          if (row.key === "steel_table" && row.value) setSteel(row.value as SteelTableSettings);
          if (row.key === "sink" && row.value) setSink(row.value as SinkSettings);
          if (row.key === "shelf" && row.value) setShelf(row.value as ShelfSettings);
        }
      });
    return () => {
      on = false;
    };
  }, []);
  return { steel, sink, shelf };
}
