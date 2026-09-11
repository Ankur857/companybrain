import React from 'react';
import {
  Award,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  Lock,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { Experience3DWorkflow } from './3d/Experience3DWorkflow';

export function ExperienceSection() {
  const steps = [
    {
      num: '01',
      title: 'Problem Encountered',
      desc: 'An engineer solves a complex edge case in production (e.g. Stripe webhook idempotency failure).',
      actor: 'Team Member',
      icon: AlertCircle,
      color: 'text-amber-400',
    },
    {
      num: '02',
      title: 'Structured Documentation',
      desc: 'They document the exact Problem, Solution code, and Additional Context linked to Project Alpha.',
      actor: 'Submission Form',
      icon: FileText,
      color: 'text-sky-400',
    },
    {
      num: '03',
      title: 'Admin Verification',
      desc: 'Tech leads review the accuracy of the fix to prevent inaccurate runbooks from propagating.',
      actor: 'Admin Review',
      icon: UserCheck,
      color: 'text-indigo-400',
    },
    {
      num: '04',
      title: 'Verified Experience',
      desc: 'The verified fix becomes institutional knowledge, accessible via natural language queries.',
      actor: 'Policy-Aware AI',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section id="experience" className="relative py-24 bg-[#090e1a] border-t border-slate-800">
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-mono mb-4">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>CONTINUOUS INSTITUTIONAL LEARNING</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Capture institutional memory <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400">
              before it walks out the door.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Transform everyday troubleshooting into permanent organizational intelligence. Every approved experience directly strengthens the AI Assistant for the rest of your team.
          </p>
        </div>

        {/* 3D Milestone Lifecycle Workflow */}
        <div className="max-w-4xl mx-auto mb-12">
          <Experience3DWorkflow />
        </div>

        {/* Elegant Timeline Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative mb-14">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative p-6 rounded-2xl bg-[#0d1424] border border-slate-800 flex flex-col justify-between shadow-xl group hover:border-slate-700 transition-all hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {step.actor}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3 ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Arrow connector */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Realistic Verified Experience Card Example */}
        <div className="max-w-3xl mx-auto rounded-2xl bg-[#0c1322] border border-purple-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Stripe Webhook Concurrency Race Condition</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Linked Project: Project Alpha · Author: Vikram Rao</div>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-mono text-indigo-400">ID: EXP-2024-009</span>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <span className="font-mono text-[11px] text-amber-400 uppercase tracking-wider block mb-1">
                Problem:
              </span>
              <p className="text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                Duplicate charge webhooks arriving within 8ms caused double balance ledger credit during high flash-sale load.
              </p>
            </div>

            <div>
              <span className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider block mb-1">
                Verified Solution:
              </span>
              <p className="text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                Implemented Redis distributed lock (<code className="text-indigo-300">SETNX</code>) with 15s TTL keyed on <code className="text-indigo-300">evt_id</code> before opening the DB transaction.
              </p>
            </div>
          </div>

          {/* Critical Permission Boundary Note */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Lock className="w-3.5 h-3.5" />
              Inherited Access Policy: Project Alpha members only
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Respects RBAC boundary
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
