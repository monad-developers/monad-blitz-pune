# Monad Arcade - Farcaster Games 🎮

## What's Been Implemented

### ✅ Core Infrastructure
1. **Games Navigation System**
   - Main games listing page at `/games`
   - Beautiful grid layout with game cards
   - Stats display showing game counts
   - Mobile-optimized design

2. **Home Page Integration**
   - Added prominent "Play Games" CTA on home page
   - Updated branding from "Template" to "Monad Arcade"

3. **Rock Paper Scissors Game** (Fully Functional)
   - Complete gameplay implementation
   - Stat tracking (wins, losses, ties)
   - Emoji-based UI for better mobile UX
   - Animations and transitions
   - Responsive design

4. **Game Placeholder Pages**
   - Showdown
   - Head Soccer
   - Slither
   - Paaji
   - Endless Runner
   - All have "Coming Soon" pages with proper routing

5. **Configuration Updates**
   - Added `lucide-react` dependency for icons
   - Updated `farcaster.json` with game-related metadata
   - Changed category to "entertainment"
   - Updated branding and splash colors

## Directory Structure

```
apps/farcaster/
├── app/
│   ├── games/
│   │   ├── page.tsx                    # Main games listing
│   │   ├── rock-paper-scissor/
│   │   │   └── page.tsx                # ✅ Fully implemented
│   │   ├── showdown/
│   │   │   └── page.tsx                # 🚧 Placeholder
│   │   ├── head-soccer/
│   │   │   └── page.tsx                # 🚧 Placeholder
│   │   ├── slither/
│   │   │   └── page.tsx                # 🚧 Placeholder
│   │   ├── paaji/
│   │   │   └── page.tsx                # 🚧 Placeholder
│   │   └── endless-runner/
│   │       └── page.tsx                # 🚧 Placeholder
│   └── page.tsx                         # Updated with games CTA
├── components/
│   ├── games/
│   │   └── rock-paper-scissor.tsx      # ✅ Game component
│   └── Home/
│       └── index.tsx                    # Updated with games link
├── GAMES_IMPLEMENTATION.md              # Detailed implementation guide
└── README_GAMES.md                      # This file
```

## Quick Start

### 1. Install Dependencies
```bash
cd apps/farcaster
pnpm install
```

### 2. Run Development Server
```bash
pnpm dev
```

### 3. Open in Browser
Navigate to `http://localhost:3000/games` to see the games listing.

### 4. Test Rock Paper Scissors
Click on "Rock Paper Scissors" card to play the fully functional game.

## Testing in Farcaster

### Local Testing with Cloudflared

1. Install cloudflared:
```bash
brew install cloudflared
```

2. Expose your local server:
```bash
cloudflared tunnel --url http://localhost:3000
```

3. Copy the URL (e.g., `https://xyz.trycloudflare.com`)

4. Test in [Warpcast Embed Tool](https://warpcast.com/~/developers/mini-apps/embed)

## What's Next

### Immediate Next Steps

1. **Implement Remaining Games**
   - See `GAMES_IMPLEMENTATION.md` for detailed guide
   - Start with simpler games like Showdown
   - Then tackle canvas-based games

2. **Original Game Components Location**
   - All original implementations: `/apps/web/components/games/`
   - Use Rock Paper Scissors as a reference for adapting them

3. **Key Adaptations Needed**
   - Remove wagmi/wallet dependencies
   - Remove staking logic (or adapt for Farcaster)
   - Optimize for mobile screens
   - Simplify controls for touch
   - Use Farcaster context instead of custom hooks

### Enhancement Ideas

- **Leaderboards**: Use Upstash Redis for global high scores
- **Social Features**: Cast game results directly from the game
- **Wallet Integration**: Add optional on-chain rewards using Farcaster's wallet
- **Multiplayer**: Real-time games using WebSockets
- **Daily Challenges**: Rotating game modes with special rewards
- **Achievements**: Track player accomplishments

## Game Implementation Priority

### Easy (Start Here)
1. ✅ **Rock Paper Scissors** - Done!
2. 🎯 **Showdown** - Simple reaction time game
   - Original: `/apps/web/components/games/showdown/index.tsx`
   - Minimal state, button-based

### Medium
3. **Slither** - Canvas-based snake game
   - Original: `/apps/web/components/games/slither/index.tsx`
   - Canvas rendering, touch controls needed

### Complex (Requires More Work)
4. **Head Soccer** - Physics-based game
5. **Paaji** - Adventure game with complex mechanics
6. **Endless Runner** - Platformer with animations

## Architecture Notes

### Farcaster-Specific Features

```tsx
import { useFrame } from '@/components/farcaster-provider'

// Access user context
const { context } = useFrame()
const username = context?.user?.displayName
const fid = context?.user?.fid

// Safe area insets (for notch support)
<SafeAreaContainer insets={context?.client.safeAreaInsets}>
  {/* Your content */}
</SafeAreaContainer>

// Wallet integration
import { useAccount } from 'wagmi'
const { address } = useAccount()
```

### Key Differences from Main App

| Feature | Main App | Farcaster App |
|---------|----------|---------------|
| React Version | 19 | 18 |
| Next.js Version | 16 | 14 |
| Wallet Provider | Custom wagmi | Farcaster wagmi connector |
| Screen Size | Desktop + Mobile | Mobile-first |
| Animations | Motion (Framer) | CSS/Simple animations |
| Staking | Integrated | Optional/Simplified |

## Files Modified

### Created
- ✅ `/app/games/page.tsx` - Main games listing
- ✅ `/app/games/rock-paper-scissor/page.tsx` - RPS game page
- ✅ `/app/games/*/page.tsx` - 5 placeholder pages
- ✅ `/components/games/rock-paper-scissor.tsx` - RPS component
- ✅ `GAMES_IMPLEMENTATION.md` - Implementation guide
- ✅ `README_GAMES.md` - This file

### Modified
- ✅ `/components/Home/index.tsx` - Added games CTA
- ✅ `/package.json` - Added lucide-react
- ✅ `/app/.well-known/farcaster.json/route.ts` - Updated metadata

## Resources

- 📖 [Implementation Guide](./GAMES_IMPLEMENTATION.md) - Detailed how-to
- 🎮 [Original Games](../web/components/games/) - Source implementations
- 📚 [Farcaster Docs](https://miniapps.farcaster.xyz/) - Official docs
- 🔧 [Warpcast Embed Tool](https://warpcast.com/~/developers/mini-apps/embed) - Testing tool

## Support

For questions or issues:
1. Check `GAMES_IMPLEMENTATION.md` for detailed guides
2. Reference the Rock Paper Scissors implementation
3. Review original game components in `/apps/web/components/games/`
4. Consult Farcaster Mini Apps documentation

---

**Ready to implement more games?** Open `GAMES_IMPLEMENTATION.md` and follow the step-by-step guide! 🚀
