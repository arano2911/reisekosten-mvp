import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    href: "/submit/fke",
    title: "FKE-Fahrt",
    desc: "Einsatz wählen, Datum & Richtung",
  },
  {
    href: "/submit/vma",
    title: "VMA-Tage",
    desc: "Tage erfassen, automatisch berechnet",
  },
  {
    href: "/submit/receipt",
    title: "Beleg",
    desc: "Ticket, Tank oder Sonderbeleg hochladen",
  },
];

export default function SubmitPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Neu einreichen</h1>

      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="transition active:scale-[0.99]">
            <CardContent className="p-4 space-y-1">
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-muted-foreground">
                {item.desc}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
