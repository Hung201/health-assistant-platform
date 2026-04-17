import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

export type GoogleAuthUser = {
  provider: 'google';
  providerSub: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      // Use non-empty placeholders to avoid crashing the app when env is not configured.
      // The /auth/google flow will still fail until you set real credentials.
      clientID: process.env.GOOGLE_CLIENT_ID ?? 'missing-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'missing-google-client-secret',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      photos?: Array<{ value?: string }>;
      emails?: Array<{ value?: string }>;
    },
  ): GoogleAuthUser {
    const email = profile.emails?.[0]?.value ?? null;
    const avatarUrl = profile.photos?.[0]?.value ?? null;
    return {
      provider: 'google',
      providerSub: profile.id,
      email,
      fullName: profile.displayName ?? null,
      avatarUrl,
    };
  }
}

