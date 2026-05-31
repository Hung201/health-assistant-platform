'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { AIAssistantShared } from '@/components/chat/AIAssistantShared';
import '../../(patient)/patient.css';

export default function AIDiagnosticPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) {
      router.replace('/patient/ai-assistant');
    }
  }, [user, router]);

  return (
    <div className="bg-[#fafafb] min-h-[calc(100vh-80px)] flex flex-col p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1400px] flex-1">
        <AIAssistantShared />
      </div>
    </div>
  );
}
