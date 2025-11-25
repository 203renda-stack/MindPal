import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { MoodEntry } from '../../types';

interface MoodChartProps {
  data: MoodEntry[];
}

export const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100">
        <p>暂无情绪记录</p>
        <p className="text-xs mt-2">多和 MindPal 聊聊吧</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-600 mb-4">情绪趋势</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 10}} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[0, 10]} 
            tick={{fontSize: 10}} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#0f766e' }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#0d9488" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};