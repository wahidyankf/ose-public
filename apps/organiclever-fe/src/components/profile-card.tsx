import { Button, Card, CardContent, CardHeader } from "@open-sharia-enterprise/ts-ui";

interface ProfileCardProps {
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
}

export function ProfileCard({ name, email, avatarUrl }: ProfileCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="text-lg leading-none font-semibold tracking-tight">Your Profile</h1>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${name}'s profile picture`}
            width={80}
            height={80}
            className="rounded-full ring-2 ring-border"
          />
        )}
        <div className="text-center">
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button type="submit" variant="outline" className="min-h-11 min-w-11">
            Sign out
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
