import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * A reusable component to display an "Access Denied" message.
 * This should be rendered on the server when a user is authenticated but
 * lacks the specific roles or permissions required to view a page.
 */
export default function Unauthorized() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Sorry, you do not have the necessary permissions to access this page. This area is restricted to users with a specific role (e.g., &apos;manager&apos;).
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href="/">
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}