import React from 'react';
import { GraduationCap, PlayCircle, CheckCircle2, Clock } from 'lucide-react';

export const LearningPage: React.FC = () => {
  const tracks = [
    {
      title: 'Módulo 1: O Destino do Dinheiro',
      lessons: [
        { title: 'Por que o dinheiro familiar precisa de caixinhas?', time: '6 min', done: true },
        { title: 'Como criar sua primeira Reserva de Emergência', time: '8 min', done: true },
        { title: 'Dividindo contas com o cônjuge sem atrito', time: '10 min', done: false },
      ],
    },
    {
      title: 'Módulo 2: Educação Financeira para Filhos',
      lessons: [
        { title: 'Mesada educativa: ensinando o valor da poupança', time: '7 min', done: false },
        { title: 'Primeiras metas e sonhos das crianças', time: '5 min', done: false },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-gold-deep">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-navy">Trilhas de Educação Financeira</h2>
          <p className="text-xs text-muted">
            Aulas curtas e práticas sobre planejamento, investimentos e finanças em família.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tracks.map((track) => (
          <div key={track.title} className="card">
            <h3 className="text-base font-bold text-navy mb-3">{track.title}</h3>
            <div className="space-y-2">
              {track.lessons.map((lesson) => (
                <div
                  key={lesson.title}
                  className="p-3.5 rounded-2xl bg-white/70 border border-navy/10 flex items-center justify-between hover:border-navy/30 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy/5 text-navy">
                      <PlayCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy">{lesson.title}</p>
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <Clock className="h-3 w-3" /> {lesson.time}
                      </span>
                    </div>
                  </div>

                  {lesson.done ? (
                    <span className="pill bg-ok/10 text-ok text-[11px] font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                    </span>
                  ) : (
                    <button className="btn-line text-[11px] h-[30px] px-3">
                      Assistir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
