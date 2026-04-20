import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ name, value, icon: Icon, color, change }) {
  const isPositive = change?.startsWith('+');
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{name}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}