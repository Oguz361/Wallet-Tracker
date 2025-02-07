// app/auth/layout.tsx
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen">
        <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0">
          <div className="lg:p-8">
            {children}
          </div>
        </div>
      </div>
    )
  }