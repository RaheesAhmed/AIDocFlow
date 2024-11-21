# UNDERCONSTRUCTION-


# DocFlowAI - Intelligent Document Chat Platform


DocFlowAI is a sophisticated document chat platform that enables intelligent conversations with your documents using advanced AI capabilities. Built with modern web technologies, it offers a premium, enterprise-grade experience for document analysis and interaction.

## 🌟 Features

### 💬 Advanced Chat Interface
- Real-time chat with AI about your documents
- Persistent chat history with Supabase integration
- Markdown support for rich text formatting
- Collapsible sidebars for optimal workspace utilization
- Professional UI with smooth animations

### 📁 File Management
- Intuitive file explorer
- Document upload capabilities
- File preview support
- Organized file structure

### 🎨 Premium UI/UX
- Modern three-column layout
- Responsive design with smooth animations
- Professional color scheme with gradients
- Clean typography and spacing
- Framer Motion animations

### 🔒 Security & Performance
- Secure document handling
- Efficient state management
- Optimized file processing
- Supabase backend integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RaheesAhmed/.git
cd AIDocFlow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

4. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **UI Components**: Radix UI
- **Markdown**: react-markdown

### Backend
- **Database**: Supabase
- **API Routes**: Next.js API Routes
- **File Processing**: Custom processing pipeline

### Key Dependencies
- @radix-ui/* - UI components
- date-fns - Date formatting
- react-markdown - Markdown rendering
- framer-motion - Animations
- @supabase/supabase-js - Database integration

## 📁 Project Structure

```
docflowai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   └── upload/           # File upload functionality
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                   # Utility functions
└── public/               # Static assets
```

## 🔧 Configuration

### Tailwind Configuration
The project uses a custom Tailwind configuration with:
- Custom color schemes
- Typography plugin
- Extended theme properties

### Supabase Schema
Required tables:
- `chat_sessions`: Stores chat history
- `chat_messages`: Individual chat messages
- `files`: Document storage

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the backend infrastructure
- Radix UI for accessible components
- All contributors and users of DocFlowAI

---

<p align="center">Made with ❤️ by Rahees Ahmed</p>
