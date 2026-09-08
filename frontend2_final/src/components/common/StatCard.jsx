import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Card from "./Card";

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-medium text-slate-500">
              {title}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {value}
            </p>

            {change && (
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <ArrowUpRight size={14} />
                {change}
              </div>
            )}
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              tones[tone] || tones.blue
            }`}
          >
            {Icon && <Icon size={23} />}
          </div>

        </div>
      </Card>
    </motion.div>
  );
}