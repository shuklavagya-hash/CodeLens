import './globals.css';

export const metadata = {
  title: 'CodeLens — See what breaks before you touch it',
  description: 'On-device dependency graph and blast-radius analysis for legacy codebases.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
