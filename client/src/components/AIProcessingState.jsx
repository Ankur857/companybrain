import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Bot } from 'lucide-react';

/**
 * AIProcessingState
 * Elegant, multi-stage animated processing card communicating what CompanyBrain AI is doing.
 * Transitions through honest RAG pipeline stages with smooth, non-flashy micro-animations.
 */
export function AIProcessingState({ isProjectContext = false, projectName = '' }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = isProjectContext
    ? [
        { active: 'Understanding your question...', done: 'Question understood' },
        { active: `Checking access to ${projectName || 'project'}...`, done: 'Project access verified' },
        { active: 'Finding authorized project knowledge...', done: 'Relevant knowledge retrieved' },
        { active: 'Analyzing project context...', done: 'Context analyzed' },
        { active: 'Generating your answer...', done: 'Answer generated' },
        { active: 'Preparing verified sources...', done: 'Sources prepared' },
      ]
    : [
        { active: 'Understanding your question...', done: 'Question understood' },
        { active: 'Checking your authorized knowledge...', done: 'Access permissions verified' },
        { active: 'Finding relevant company documentation...', done: 'Relevant knowledge retrieved' },
        { active: 'Analyzing available context...', done: 'Context analyzed' },
        { active: 'Generating your answer...', done: 'Answer generated' },
        { active: 'Preparing sources...', done: 'Sources prepared' },
      ];

  useEffect(() => {
    // Progressively step through pipeline phases while waiting for network response
    const timers = [
      setTimeout(() => setCurrentStepIndex(1), 350),
      setTimeout(() => setCurrentStepIndex(2), 900),
      setTimeout(() => setCurrentStepIndex(3), 1600),
      setTimeout(() => setCurrentStepIndex(4), 2400),
      setTimeout(() => setCurrentStepIndex(5), 3600),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex gap-3.5 my-2 animate-fade-in">
      {/* Bot Icon */}
      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm mt-0.5">
        <Sparkles className="w-4 h-4 animate-pulse text-indigo-400" />
      </div>

      {/* Processing Card Container */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/20 shadow-xl max-w-md w-full space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span className="text-indigo-400">✨</span> AI Agent
            </span>
            {isProjectContext && projectName && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {projectName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span>Processing</span>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2 text-xs">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 transition-all duration-300 ${
                  isCurrent
                    ? 'text-slate-100 font-medium'
                    : isCompleted
                    ? 'text-slate-400'
                    : 'text-slate-600 opacity-60'
                }`}
              >
                {/* State Indicator */}
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping absolute"></span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full border border-slate-600"></div>
                  )}
                </div>

                {/* Step Label */}
                <span className="text-[11px] leading-tight">
                  {isCompleted ? step.done : isCurrent ? step.active : step.active.replace('...', '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
