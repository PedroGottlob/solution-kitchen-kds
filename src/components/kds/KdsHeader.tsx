interface KdsHeaderProps {
  pending: number
  preparing: number
  ready: number
  connected: boolean
}

export function KdsHeader({ pending, preparing, ready, connected }: KdsHeaderProps) {
  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-white font-medium text-lg">Cozinha · KDS</span>
        <span className="text-xs text-zinc-500">
          {connected ? 'ao vivo' : 'desconectado'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-amber-400 text-xl font-medium">{pending}</div>
          <div className="text-zinc-500 text-xs">Na fila</div>
        </div>
        <div className="text-center">
          <div className="text-violet-400 text-xl font-medium">{preparing}</div>
          <div className="text-zinc-500 text-xs">Em preparo</div>
        </div>
        <div className="text-center">
          <div className="text-emerald-400 text-xl font-medium">{ready}</div>
          <div className="text-zinc-500 text-xs">Prontos</div>
        </div>
      </div>

      {/* Time */}
      <div className="text-zinc-500 text-sm">
        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}