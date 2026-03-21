import type { CardColor, CardRarity, CardType } from '@/types'

export function useCardUtils() {
  const colorConfig: Record<string, {
    label: string; accent: string; border: string
    bg: string; dot: string; glow: string; apiValue: string
  }> = {
    ironclad: {
      label: 'The Ironclad', apiValue: 'ironclad',
      accent: 'text-red-400',    border: 'border-red-600',
      bg: 'bg-red-950/20',       dot: 'bg-red-500',    glow: 'shadow-glow-red',
    },
    silent: {
      label: 'The Silent',   apiValue: 'silent',
      accent: 'text-emerald-400', border: 'border-emerald-600',
      bg: 'bg-emerald-950/20',    dot: 'bg-emerald-500', glow: 'shadow-glow-green',
    },
    defect: {
      label: 'The Defect',   apiValue: 'defect',
      accent: 'text-sky-400',    border: 'border-sky-600',
      bg: 'bg-sky-950/20',        dot: 'bg-sky-500',    glow: 'shadow-glow-blue',
    },
    necrobinder: {
      label: 'The Necroblinder', apiValue: 'necrobinder',
      accent: 'text-pink-400',   border: 'border-pink-600',
      bg: 'bg-pink-950/20',       dot: 'bg-pink-500',   glow: 'shadow-glow-pink',
    },
    regent: {
      label: 'The Regent',   apiValue: 'regent',
      accent: 'text-orange-400', border: 'border-orange-600',
      bg: 'bg-orange-950/20',     dot: 'bg-orange-500', glow: 'shadow-glow-orange',
    },
    colorless: {
      label: 'Colorless',    apiValue: 'colorless',
      accent: 'text-slate-400',  border: 'border-slate-500',
      bg: 'bg-slate-800/20',      dot: 'bg-slate-500',  glow: '',
    },
  }

  const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
    Attack: { label: 'Attack', icon: '⚔️', color: 'text-red-400'    },
    Skill:  { label: 'Skill',  icon: '✦',  color: 'text-sky-400'    },
    Power:  { label: 'Power',  icon: '⚡', color: 'text-amber-400'  },
    Status: { label: 'Status', icon: '🩸', color: 'text-orange-400' },
    Curse:  { label: 'Curse',  icon: '💀', color: 'text-zinc-400'   },
  }

  const rarityConfig: Record<string, { label: string; color: string; borderColor: string }> = {
    Basic:    { label: 'Basic',    color: 'text-slate-400', borderColor: 'border-slate-600' },
    Common:   { label: 'Common',   color: 'text-slate-300', borderColor: 'border-slate-500' },
    Uncommon: { label: 'Uncommon', color: 'text-sky-300',   borderColor: 'border-sky-600'   },
    Rare:     { label: 'Rare',     color: 'text-amber-400', borderColor: 'border-amber-500' },
    Ancient:  { label: 'Ancient',  color: 'text-purple-400',borderColor: 'border-purple-600'},
  }

  const colorOrder  = ['ironclad', 'silent', 'defect', 'necrobinder', 'regent', 'colorless'] as const
  const typeOrder   = ['Attack', 'Skill', 'Power', 'Status', 'Curse'] as const
  const rarityOrder = ['Basic', 'Common', 'Uncommon', 'Rare', 'Ancient'] as const
  const keywordOrder = ['Exhaust', 'Innate', 'Ethereal', 'Retain', 'Unplayable', 'Sly', 'Eternal'] as const

  function getColor(key: string) { return colorConfig[key] ?? colorConfig['colorless'] }
  function getType(key: string)  { return typeConfig[key]  ?? typeConfig['Skill']      }
  function getRarity(key: string){ return rarityConfig[key]?? rarityConfig['Common']   }

  return { colorConfig, typeConfig, rarityConfig, colorOrder, typeOrder, rarityOrder, keywordOrder, getColor, getType, getRarity }
}
