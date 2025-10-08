import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface HomeScreenProps {
  t: (en: string, es: string) => string;
}

const RECENT_SERVICES = [
  {
    id: "1",
    title: "Revival Sunday — The Fire Returns",
    date: "Sep 29, 2025",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=60",
    url: "https://www.youtube.com/",
  },
  {
    id: "2",
    title: "Prayer Night — Healing & Power",
    date: "Sep 22, 2025",
    image:
      "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=900&q=60",
    url: "https://www.youtube.com/",
  },
  {
    id: "3",
    title: "Midweek Service — Faith Over Fear",
    date: "Sep 15, 2025",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop",
    url: "https://www.youtube.com/",
  },
];

export function HomeScreen({ t }: HomeScreenProps) {
  const [search, setSearch] = useState("");

  const filteredServices = RECENT_SERVICES.filter((service) =>
    service.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("Search services...", "Buscar servicios...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 rounded-full"
        />
      </div>

      {/* Section Title */}
      <h2 className="text-2xl font-extrabold text-foreground">
        {t("Recent Services", "Servicios Recientes")}
      </h2>

      {/* Services List */}
      <div className="space-y-5">
        {filteredServices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("No services found.", "No se encontraron servicios.")}
          </p>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-full h-48 bg-muted">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-muted-foreground">{service.date}</p>
                <h3 className="text-lg font-bold text-foreground">
                  {service.title}
                </h3>
                <Button
                  onClick={() => window.open(service.url, "_blank")}
                  className="w-full font-bold"
                >
                  {t("Watch Now", "Ver Ahora")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
