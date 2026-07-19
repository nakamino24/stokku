import { FiShield, FiRefreshCw, FiUsers, FiLock } from 'react-icons/fi';

export default function BrandPanel() {
  return (
    <div
      className="relative flex flex-col justify-between h-full px-10 py-12"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #818cf8 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, #4f46e5 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">Stokku</span>
        </div>

        <h1 className="text-white text-3xl font-bold leading-tight mb-4 tracking-tight">
          Simple inventory management
          <br />
          <span style={{ color: '#a5b4fc' }}>for growing businesses</span>
        </h1>

        <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
          Stop losing stock, wasting time on spreadsheets, and dealing with inaccurate counts.
          Stokku gives you real-time visibility into every item in every location.
        </p>

        <div className="space-y-5">
          <BenefitRow icon={<FiRefreshCw className="w-4 h-4 text-indigo-300" />} text="Track stock in real time across all locations" delay={400} />
          <BenefitRow icon={<FiShield className="w-4 h-4 text-indigo-300" />} text="Reduce discrepancies with cycle counts" delay={550} />
          <BenefitRow icon={<FiUsers className="w-4 h-4 text-indigo-300" />} text="Manage inventory with your team" delay={700} />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-slate-500 text-xs">
        <FiLock className="w-3 h-3" />
        <span>Secured with 256-bit encryption</span>
      </div>
    </div>
  );
}

function BenefitRow({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) {
  return (
    <div
      className="flex items-center gap-3.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 shrink-0">
        {icon}
      </div>
      <span className="text-slate-300 text-sm">{text}</span>
    </div>
  );
}
