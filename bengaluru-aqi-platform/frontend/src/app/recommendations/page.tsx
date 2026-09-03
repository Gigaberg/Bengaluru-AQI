import { Lightbulb, Wind, Factory, Car } from 'lucide-react';

export default function RecommendationsPage() {
  const recommendations = [
    {
      pollutant: 'High PM2.5 (Fine Particles)',
      icon: <Wind className="h-6 w-6 text-rose-500" />,
      strategies: [
        'Enforce strict emission controls on heavy-duty diesel vehicles within city limits.',
        'Implement "Green Buffer Zones" around high-density residential areas.',
        'Ban open waste burning and improve municipal solid waste collection.',
        'Promote EV adoption for public transport and last-mile delivery fleets.'
      ]
    },
    {
      pollutant: 'High PM10 (Coarse Particles)',
      icon: <Factory className="h-6 w-6 text-orange-500" />,
      strategies: [
        'Mandate dust suppression techniques (water sprinkling, covers) at all construction sites.',
        'Increase mechanical sweeping of major arterial roads during non-peak hours.',
        'Pave unpaved road shoulders and plant low-height shrubs to trap dust.',
        'Restrict movement of uncovered construction material transport trucks.'
      ]
    },
    {
      pollutant: 'High NO₂ (Nitrogen Dioxide)',
      icon: <Car className="h-6 w-6 text-amber-500" />,
      strategies: [
        'Implement low-emission zones (LEZs) restricting older, highly polluting vehicles.',
        'Optimize traffic signal synchronization to reduce idling at major intersections.',
        'Encourage staggered working hours to reduce peak hour traffic congestion.',
        'Shift industrial processes relying on diesel generators to clean grid power.'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white light:text-[#1d1d1f] tracking-tight">Recommendations & Interventions</h1>
        <p className="text-lg text-[#86868b] dark:text-[#98989d] light:text-[#6e6e73] mt-2 max-w-2xl mx-auto">
          Targeted mitigation strategies grouped by dominant pollutant. 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recommendations.map((rec) => (
          <div key={rec.pollutant} className="bg-[#f5f5f7] dark:bg-[#1c1c1e] light:bg-[#f5f5f7] rounded-3xl overflow-hidden flex flex-col transition-colors duration-300">
            <div className="p-8 border-b border-[#e5e5ea] dark:border-white/10 light:border-[#e5e5ea] bg-[#e5e5ea]/50 dark:bg-white/5 light:bg-[#e5e5ea]/50 flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-white/10 light:bg-white rounded-2xl shadow-sm">
                {rec.icon}
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white light:text-[#1d1d1f] tracking-tight">{rec.pollutant}</h2>
            </div>
            <div className="p-8 flex-grow">
              <ul className="space-y-5">
                {rec.strategies.map((strategy, idx) => (
                  <li key={idx} className="flex gap-4">
                    <Lightbulb className="h-5 w-5 text-blue-500 dark:text-blue-400 light:text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[#86868b] dark:text-[#98989d] light:text-[#6e6e73] text-sm leading-relaxed">{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
