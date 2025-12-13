# Contributing to Monad Arcade

Thank you for your interest in contributing to Monad Arcade! 🎮

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push and create a Pull Request

## 📁 Project Structure

```
monad-arcade/
├── apps/
│   ├── web/              # Main Next.js application
│   ├── farcaster/        # Farcaster Mini App
│   └── monad/            # Smart contracts
```

## 🎮 Adding a New Game

See `/apps/web/components/games/` for examples.

### Steps:
1. Create game component in `/apps/web/components/games/your-game/`
2. Add game page in `/apps/web/app/(protected)/games/your-game/`
3. Update games listing
4. Add to Farcaster if applicable

## 🛠️ Development

```bash
# Install dependencies
bun install

# Run web app
cd apps/web
bun dev

# Run Farcaster app
cd apps/farcaster
pnpm dev

# Deploy contracts
cd apps/monad
npx hardhat run scripts/deploy-stake-game.ts
```

## 📝 Code Standards

- Use TypeScript strict mode
- Follow existing code style
- Add comments for complex logic
- Write clean, readable code
- Test your changes

## 🧪 Testing

- Test all games thoroughly
- Check mobile responsiveness
- Verify wallet integration
- Test on Monad testnet

## 💬 Questions?

Open an issue or join our Discord!

---

**Thank you for contributing to Monad Arcade! 🙏**
