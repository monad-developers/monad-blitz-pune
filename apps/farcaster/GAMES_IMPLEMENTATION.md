# Monad Arcade - Farcaster Games Implementation Guide

## Overview

This guide explains how to complete the implementation of games for the Monad Arcade Farcaster Mini App.

## ✅ Completed

- ✅ Games directory structure
- ✅ Games listing page at `/games`
- ✅ Navigation from home to games
- ✅ Rock Paper Scissors game (fully implemented)
- ✅ Placeholder pages for remaining games
- ✅ Updated package.json with lucide-react
- ✅ Updated farcaster.json manifest

## 🎮 Games Status

### 1. Rock Paper Scissors ✅ **COMPLETE**
- Location: `/app/games/rock-paper-scissor/page.tsx`
- Component: `/components/games/rock-paper-scissor.tsx`
- Features: Fully functional, stat tracking, emoji-based UI

### 2. Showdown 🚧 **TO IMPLEMENT**
- Location: `/app/games/showdown/page.tsx` (placeholder created)
- Original: `/apps/web/components/games/showdown/index.tsx`
- Type: Reaction time game

### 3. Head Soccer 🚧 **TO IMPLEMENT**
- Location: `/app/games/head-soccer/page.tsx` (placeholder created)
- Original: `/apps/web/components/games/head-soccer/index.tsx`
- Type: Physics-based sports game with canvas rendering

### 4. Slither 🚧 **TO IMPLEMENT**
- Location: `/app/games/slither/page.tsx` (placeholder created)
- Original: `/apps/web/components/games/slither/index.tsx`
- Type: Snake game with canvas rendering

### 5. Paaji 🚧 **TO IMPLEMENT**
- Location: `/app/games/paaji/page.tsx` (placeholder created)
- Original: `/apps/web/components/games/paaji/index.tsx`
- Type: Adventure game with canvas rendering

### 6. Endless Runner 🚧 **TO IMPLEMENT**
- Location: `/app/games/endless-runner/page.tsx` (placeholder created)
- Original: `/apps/web/components/games/endless-runner/index.tsx`
- Type: Platformer with canvas rendering

## 📋 Implementation Steps for Each Game

### General Pattern

1. **Copy the original game component** from `/apps/web/components/games/[game-name]/`
2. **Create a new component** in `/apps/farcaster/components/games/[game-name].tsx`
3. **Adapt the component:**
   - Remove wagmi/wallet dependencies (or adapt to use Farcaster's wallet)
   - Remove staking logic (unless implementing on-chain features)
   - Simplify to core gameplay
   - Optimize for mobile/smaller screens
   - Use Farcaster context: `const { context } = useFrame()`
4. **Update the placeholder page** in `/apps/farcaster/app/games/[game-name]/page.tsx`
5. **Test in Farcaster** using the embed tool

### Example: Rock Paper Scissors (Reference Implementation)

See `/components/games/rock-paper-scissor.tsx` for a complete example of how to:
- Structure a simple game component
- Handle game state
- Track statistics
- Provide mobile-friendly UI
- Integrate with Farcaster context

### Key Differences from Main App

| Main App (`/apps/web`) | Farcaster App (`/apps/farcaster`) |
|---|---|
| Uses wagmi for wallet connection | Uses Farcaster SDK |
| Includes staking/blockchain logic | Focus on gameplay (optional blockchain) |
| React 19, Next.js 16 | React 18, Next.js 14 |
| motion (Framer Motion) available | Standard CSS animations recommended |
| Larger screens | Mobile-optimized |

## 🎨 UI Guidelines

### Colors
- Use gradient backgrounds: `from-purple-100 to-white`
- Game-specific gradients (see placeholder pages)
- White cards with shadows for game elements
- Bold, colorful text for headings

### Layout
- Mobile-first design
- Max width containers: `max-w-2xl mx-auto`
- Generous padding: `p-4` or `p-6`
- Rounded corners: `rounded-2xl` or `rounded-3xl`
- Shadows: `shadow-lg` or `shadow-xl`

### Components
```tsx
// Safe Area Container (required)
<SafeAreaContainer insets={context?.client.safeAreaInsets}>
  {/* Your game content */}
</SafeAreaContainer>

// Back Button Pattern
<Link href="/games" className="...">
  ← Back
</Link>

// Game Stats Card
<div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
  {/* Stats content */}
</div>
```

## 🎯 Canvas-Based Games (Head Soccer, Slither, Paaji, Endless Runner)

These games use HTML5 Canvas for rendering. Key adaptations needed:

1. **Canvas Sizing**
   - Adapt to mobile screens
   - Use `useEffect` to handle resize
   - Consider portrait vs landscape

2. **Touch Controls**
   - Replace keyboard controls with touch/tap
   - Use Farcaster haptic feedback: `useHaptics()`

3. **Performance**
   - Optimize rendering loops
   - Use `requestAnimationFrame`
   - Consider reducing particle effects on mobile

### Canvas Template Structure

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@/components/farcaster-provider'

export default function CanvasGame() {
  const { context } = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState('waiting')
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size for mobile
    canvas.width = Math.min(window.innerWidth - 32, 600)
    canvas.height = canvas.width * 0.75
    
    // Game loop
    let animationId: number
    const gameLoop = () => {
      // Update game state
      // Render game
      animationId = requestAnimationFrame(gameLoop)
    }
    
    gameLoop()
    
    return () => cancelAnimationFrame(animationId)
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white p-4">
      <canvas
        ref={canvasRef}
        className="bg-white rounded-2xl shadow-lg border-2 border-gray-200"
      />
    </div>
  )
}
```

## 🔧 Development Commands

```bash
# Install dependencies
cd apps/farcaster
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

## 🧪 Testing

1. **Local Development**
   - Run `pnpm dev` in `/apps/farcaster`
   - Test at `http://localhost:3000`

2. **Farcaster Testing**
   - Use cloudflared/ngrok to expose localhost
   - Test in [Warpcast Embed Tool](https://warpcast.com/~/developers/mini-apps/embed)

3. **Mobile Testing**
   - Test on actual mobile devices
   - Check touch controls
   - Verify safe area insets

## 📚 Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz/)
- [Original Game Components](../web/components/games/)
- [Farcaster SDK Reference](https://miniapps.farcaster.xyz/docs/sdk)

## 🚀 Next Steps

1. **Implement Remaining Games**
   - Start with simpler games (Showdown)
   - Then canvas-based games
   - Test each thoroughly

2. **Add Features**
   - Leaderboards using Upstash Redis
   - Social sharing (cast results)
   - Wallet integration for rewards

3. **Polish**
   - Add loading states
   - Error handling
   - Animations
   - Sound effects (optional)

4. **Publish**
   - Update farcaster.json with proper account association
   - Add screenshots
   - Deploy to production
   - Submit to Farcaster app directory

## 💡 Tips

- Keep games simple and fast
- Focus on core gameplay
- Mobile-first always
- Test on real devices
- Use Farcaster haptics for feedback
- Consider battery/performance
- Progressive enhancement (add features gradually)

---

**Need Help?** Check the Rock Paper Scissors implementation as a reference, or refer to the original game components in `/apps/web/components/games/`.
