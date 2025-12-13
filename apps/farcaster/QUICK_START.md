# 🎮 Monad Arcade - Quick Start

## Install & Run (5 minutes)

```bash
# 1. Navigate to farcaster app
cd apps/farcaster

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev

# 4. Open in browser
# Visit: http://localhost:3000/games
```

## What Works Now ✅

- **Games Listing Page** - Beautiful grid of all 6 games
- **Rock Paper Scissors** - Fully playable with stats tracking ✅
- **Showdown** - Quick draw reaction game with canvas ✅
- **Head Soccer** - Physics-based soccer with AI opponent ✅
- **Slither** - Snake game with bot AI and orb collection ✅
- **Paaji** - Grid tile game with multipliers ✅
- **Endless Runner** - Infinite platformer with obstacles ✅
- **Navigation** - Home → Games → Individual games ✅

**ALL 6 GAMES FULLY IMPLEMENTED! 🎉**

## Test in Farcaster

```bash
# Terminal 1: Run dev server
pnpm dev

# Terminal 2: Expose with cloudflared
cloudflared tunnel --url http://localhost:3000

# Copy the URL and test in Warpcast Embed Tool
# https://warpcast.com/~/developers/mini-apps/embed
```

## Implement More Games

1. **Pick a game** from the list:
   - Showdown (easiest)
   - Slither
   - Head Soccer
   - Paaji
   - Endless Runner

2. **Copy original component** from:
   ```
   ../web/components/games/[game-name]/
   ```

3. **Create Farcaster version**:
   ```
   components/games/[game-name].tsx
   ```

4. **Update page** at:
   ```
   app/games/[game-name]/page.tsx
   ```

5. **Follow the pattern** from Rock Paper Scissors:
   - Remove wagmi dependencies
   - Simplify staking logic
   - Optimize for mobile
   - Use Farcaster context

## Key Files

```
📁 apps/farcaster/
├── 📄 README_GAMES.md              ← Start here
├── 📄 GAMES_IMPLEMENTATION.md      ← Detailed guide
├── 📄 QUICK_START.md               ← This file
├── 📁 app/games/                   
│   ├── page.tsx                    ← Games listing ✅
│   └── rock-paper-scissor/         ← Example game ✅
└── 📁 components/games/
    └── rock-paper-scissor.tsx      ← Example component ✅
```

## Next Game: Showdown (Recommended)

The easiest next game to implement:

1. **Copy from**:
   ```
   ../web/components/games/showdown/index.tsx
   ```

2. **Create**:
   ```
   components/games/showdown.tsx
   ```

3. **Key changes**:
   - Remove `useStakeGame` hook
   - Remove wagmi imports
   - Add `useFrame()` from Farcaster
   - Simplify to core gameplay
   - Mobile-friendly buttons

4. **Update**:
   ```
   app/games/showdown/page.tsx
   ```

## Need Help?

- 📖 Read `README_GAMES.md` for overview
- 📚 Read `GAMES_IMPLEMENTATION.md` for step-by-step guide
- 🎮 Study `components/games/rock-paper-scissor.tsx` as reference
- 📱 Test frequently in Warpcast Embed Tool

---

**Ready?** Start with `README_GAMES.md` for the full picture! 🚀
