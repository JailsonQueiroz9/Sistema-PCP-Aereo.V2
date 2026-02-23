
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend, BarChart, Bar,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  TrendingUp, ArrowLeft, Loader2, Zap, BarChart3, Activity,
  Filter, Calendar, Download, RefreshCw, ChevronDown
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService } from '../services/storageService';

interface ChartCardProps {
  title: string;
  subtitle: string;
  trend?: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, trend, children }) => (
  <div className="bg-[#0c1425]/40 border border-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
       <div>
         <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
         <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1 italic">{subtitle}</p>
       </div>
       {trend && (
         <div className="flex gap-4">
            <div className="text-right">
               <p className="text-[7px] font-black text-slate-700 uppercase">Indicador</p>
               <p className="text-[10px] font-black text-emerald-500 uppercase">{trend}</p>
            </div>
         </div>
       )}
    </div>
    {children}
  </div>
);

interface ReportsProps {
  theme: 'dark' | 'light';
  onBack: () => void;
}

// Helper para calcular número da semana ISO-8601 de forma robusta
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Estilo comum para Tooltips com texto BRANCO para máxima visibilidade
const tooltipStyles = {
  contentStyle: { 
    backgroundColor: '#0c1425', 
    border: '1px solid #1e293b', 
    borderRadius: '12px', 
    fontSize: '11px', 
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  },
  itemStyle: { color: '#FFFFFF' },
  labelStyle: { color: '#64748b', marginBottom: '4px' }
};

const Reports: React.FC<ReportsProps> = ({ onBack }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      setRecords(data);
    } catch (error) {
      console.error("Erro ao carregar dados analíticos:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardData = useMemo(() => {
    const weeklyData: Record<string, any> = {};
    const brandData: Record<string, any> = {
      'ASICS': { name: 'ASICS', total: 0, ok: 0, delay: 0, color: '#ec4899' },
      'FILA': { name: 'FILA', total: 0, ok: 0, delay: 0, color: '#84cc16' },
      'UMBRO': { name: 'UMBRO', total: 0, ok: 0, delay: 0, color: '#8b5cf6' }
    };

    records.forEach(r => {
      // Normalização de dados para evitar erros de leitura da planilha
      const rawDate = r.saida || r.Saída || r.chegada || r.Chegada;
      const date = rawDate ? new Date(rawDate) : null;
      if (!date || isNaN(date.getTime())) return;
      
      const weekNum = getWeekNumber(date);
      const weekLabel = `SEMANA ${weekNum}`;
      
      const statusStr = String(r.status || r.Status || '').toUpperCase();
      const isOk = statusStr.includes('OK') || statusStr.includes('ENTREGUE');
      const isDelay = statusStr.includes('ATRASADO');

      if (!weeklyData[weekLabel]) {
        weeklyData[weekLabel] = { 
          week: weekLabel, 
          weekNum,
          total: 0, ok: 0, delay: 0, 
          asicsTotal: 0, asicsOk: 0,
          filaTotal: 0, filaOk: 0,
          umbroTotal: 0, umbroOk: 0 
        };
      }
      
      weeklyData[weekLabel].total++;
      if (isOk) weeklyData[weekLabel].ok++;
      if (isDelay) weeklyData[weekLabel].delay++;

      const brandStr = (r.marca || r.Marca || '').toUpperCase().trim();
      
      if (brandStr.includes('ASICS')) {
        weeklyData[weekLabel].asicsTotal++;
        brandData['ASICS'].total++;
        if (isOk) { weeklyData[weekLabel].asicsOk++; brandData['ASICS'].ok++; }
        if (isDelay) brandData['ASICS'].delay++;
      } else if (brandStr.includes('FILA')) {
        weeklyData[weekLabel].filaTotal++;
        brandData['FILA'].total++;
        if (isOk) { weeklyData[weekLabel].filaOk++; brandData['FILA'].ok++; }
        if (isDelay) brandData['FILA'].delay++;
      } else if (brandStr.includes('UMBRO')) {
        weeklyData[weekLabel].umbroTotal++;
        brandData['UMBRO'].total++;
        if (isOk) { weeklyData[weekLabel].umbroOk++; brandData['UMBRO'].ok++; }
        if (isDelay) brandData['UMBRO'].delay++;
      }
    });

    const chartArray = Object.values(weeklyData).sort((a, b) => a.weekNum - b.weekNum).map(w => ({
      ...w,
      performance: w.total > 0 ? Math.round((w.ok / w.total) * 100) : 0,
      asicsPerf: w.asicsTotal > 0 ? Math.round((w.asicsOk / w.asicsTotal) * 100) : 0,
      filaPerf: w.filaTotal > 0 ? Math.round((w.filaOk / w.filaTotal) * 100) : 0,
      umbroPerf: w.umbroTotal > 0 ? Math.round((w.umbroOk / w.umbroTotal) * 100) : 0,
    }));

    const radarData = Object.values(brandData).map((b: any) => ({
      subject: b.name,
      A: b.total > 0 ? Math.round((b.ok / b.total) * 100) : 0,
      fullMark: 100,
    }));

    const totalDelays = Object.values(brandData).reduce((acc, curr: any) => acc + curr.delay, 0);
    const bestWeek = [...chartArray].sort((a, b) => b.performance - a.performance)[0]?.week || '-';
    const worstWeek = [...chartArray].sort((a, b) => a.performance - b.performance)[0]?.week || '-';

    return { 
      weekly: chartArray, 
      brands: Object.values(brandData),
      radar: radarData,
      stats: {
        totalRecords: records.length,
        totalDelays,
        bestWeek,
        worstWeek,
        globalPerf: records.length > 0 ? Math.round((records.filter(r => {
          const s = String(r.status || r.Status || '').toUpperCase();
          return s.includes('OK') || s.includes('ENTREGUE');
        }).length / records.length) * 100) : 0
      }
    };
  }, [records]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050a14]">
        <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Sincronizando BI Logístico...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#050a14] p-6 custom-scrollbar">
      
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-[#0c1425] p-3 rounded-2xl border border-slate-900 shadow-xl">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500">
           <Filter size={14} />
           <span className="text-[9px] font-black uppercase tracking-widest">Base: Planilha AWB Real</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
           <BarChart3 size={14} />
           <span className="text-[9px] font-black uppercase tracking-widest">Registros: {dashboardData.stats.totalRecords}</span>
        </div>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg glow-blue">Sincronizar Agora</button>
        <div className="ml-auto flex items-center gap-3">
           <button onClick={fetchData} className="p-2 text-slate-500 hover:text-white"><RefreshCw size={16} /></button>
           <button onClick={onBack} className="p-2 text-slate-500 hover:text-white"><ArrowLeft size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        <div className="col-span-12 lg:col-span-6 space-y-6">
          
          <ChartCard 
            title="Análise de Evolução Operacional" 
            subtitle={`Melhor Semana: ${dashboardData.stats.bestWeek}`}
            trend={`${dashboardData.stats.globalPerf}% Global`}
          >
             <div className="h-64 mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.weekly}>
                    <defs>
                      <linearGradient id="colorAd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} unit="%" fontWeight="bold" />
                    <Tooltip {...tooltipStyles} />
                    <Area type="monotone" dataKey="performance" name="Eficiência" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAd)" />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard 
            title="Análise de Eficiência por Marca" 
            subtitle={`Crítico na ${dashboardData.stats.worstWeek}`}
            trend="Operacional"
          >
             <div className="h-64 mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={9} tickLine={false} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="%" fontWeight="bold" />
                    <Tooltip {...tooltipStyles} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', color: '#fff' }} />
                    <Line type="monotone" dataKey="asicsPerf" name="ASICS" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} />
                    <Line type="monotone" dataKey="filaPerf" name="FILA" stroke="#84cc16" strokeWidth={3} dot={{ r: 4, fill: '#84cc16' }} />
                    <Line type="monotone" dataKey="umbroPerf" name="UMBRO" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                  </LineChart>
               </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Radar de Performance por Recurso" subtitle="Balanceamento de Carga Global" trend="Radar">
             <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dashboardData.radar}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }} />
                    <Radar name="Performance %" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Tooltip {...tooltipStyles} />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </ChartCard>

        </div>

        <div className="col-span-12 lg:col-span-6 space-y-6">
          
          <ChartCard 
            title="Volume de Atrasos Semanais" 
            subtitle={`Total Ocorrências: ${dashboardData.stats.totalDelays}`}
            trend="Incidência"
          >
             <div className="h-64 mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" fontSize={9} tickLine={false} fontWeight="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} fontWeight="bold" />
                    <Tooltip cursor={{fill: '#ffffff10'}} {...tooltipStyles} />
                    <Bar dataKey="delay" name="Atrasos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={25} />
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Incidência de Atraso por Marca" subtitle="Ranking de Gargalos Logísticos" trend="Gargalo">
             <div className="h-64 mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={dashboardData.brands}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} hide />
                    <YAxis dataKey="name" type="category" stroke="#FFFFFF" fontSize={10} width={60} axisLine={false} tickLine={false} fontWeight="black" />
                    <Tooltip cursor={{fill: '#ffffff10'}} {...tooltipStyles} />
                    <Bar dataKey="delay" name="Total Atrasos" radius={[0, 4, 4, 0]} barSize={35}>
                       {dashboardData.brands.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </ChartCard>

          <ChartCard title="Distribuição de Fluxo por Marca" subtitle="Participação no Volume AWB Total" trend="Volume">
             <div className="h-64 mt-6">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboardData.brands} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="total" nameKey="name">
                      {dashboardData.brands.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyles} />
                    <Legend iconType="circle" align="right" layout="vertical" verticalAlign="middle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#FFFFFF' }} />
                  </PieChart>
               </ResponsiveContainer>
             </div>
          </ChartCard>

        </div>

      </div>

      <div className="mt-10 flex justify-center pb-10">
         <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            <Download size={16} /> Gerar Relatório Executivo BI
         </button>
      </div>

    </div>
  );
};

export default Reports;
