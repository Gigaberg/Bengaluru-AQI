import { Building2, Car, Hammer, Flame, Wind, Factory, ExternalLink, FileText, Scale } from 'lucide-react';

export default function GovtActionPage() {
  const interventions = [
    {
      category: 'Vehicular Emissions',
      icon: <Car className="h-6 w-6 text-blue-500" />,
      color: 'blue',
      description: 'Transportation accounts for a significant share of urban air pollution in Bengaluru, particularly PM2.5 and NOx.',
      policies: [
        {
          title: 'Vehicle Emission Standards (BS-VI)',
          details: 'Bharat Stage VI emission norms enforced since April 2020, reducing NOx emissions from diesel vehicles by up to 70% and PM by 80% compared to BS-IV.',
          authority: 'Ministry of Road Transport & Highways',
          status: 'Active'
        },
        {
          title: 'Odd-Even Scheme (Emergency)',
          details: 'Road rationing based on license plate numbers during severe air quality episodes. Implemented periodically when AQI exceeds 400.',
          authority: 'Bengaluru Traffic Police, BBMP',
          status: 'Emergency Measure'
        },
        {
          title: 'Public Transport Enhancement',
          details: 'Expansion of Namma Metro (Phase 2: 72 km under construction), procurement of 3,000+ electric buses, and integration with last-mile connectivity.',
          authority: 'BMRCL, BMTC, Karnataka Urban Infrastructure Development',
          status: 'Ongoing'
        },
        {
          title: 'Low Emission Zones (Proposed)',
          details: 'Pilot zones in Central Business District restricting entry of older diesel vehicles (>10 years) and non-BS-VI compliant commercial vehicles during peak hours.',
          authority: 'KSPCB, BBMP',
          status: 'Under Consideration'
        }
      ]
    },
    {
      category: 'Construction & Dust',
      icon: <Hammer className="h-6 w-6 text-amber-500" />,
      color: 'amber',
      description: 'Construction activity and road dust are major contributors to PM10 and coarse particulate matter in rapidly urbanizing areas.',
      policies: [
        {
          title: 'Construction & Demolition Waste Management Rules, 2016',
          details: 'Mandatory dust suppression (water sprinkling), green netting, and wheel-washing facilities at all sites >500 sq.m. Violations attract penalties up to ₹1 lakh.',
          authority: 'CPCB, KSPCB',
          status: 'Active'
        },
        {
          title: 'Mechanical Road Sweeping Program',
          details: 'Deployment of 200+ vacuum sweepers on major arterial roads and highways. Target: 80% of roads swept mechanically by 2025 (currently ~40%).',
          authority: 'BBMP, NHAI (for highways)',
          status: 'Ongoing'
        },
        {
          title: 'Green Corridor Development',
          details: 'Plantation of 1 million saplings along road medians and buffer zones to trap dust and absorb pollutants. Focus on native species (Neem, Peepal, Banyan).',
          authority: 'BBMP Forest Cell, Karnataka Forest Department',
          status: 'Ongoing'
        }
      ]
    },
    {
      category: 'Industrial Emissions',
      icon: <Factory className="h-6 w-6 text-purple-500" />,
      color: 'purple',
      description: 'Industrial zones, especially around Peenya and Whitefield, contribute SO2, NOx, and VOCs from manufacturing and power generation.',
      policies: [
        {
          title: 'Continuous Emission Monitoring Systems (CEMS)',
          details: 'Real-time monitoring mandated for all industries in 17 pollution categories. Data transmitted to KSPCB servers; non-compliance results in closure orders.',
          authority: 'CPCB, KSPCB',
          status: 'Active'
        },
        {
          title: 'Fuel Switch Mandate',
          details: 'Industries within city limits required to shift from diesel/furnace oil to PNG (Piped Natural Gas) or LPG. Deadline extended to March 2025 for MSMEs.',
          authority: 'KSPCB, Karnataka Pollution Control Board',
          status: 'Active'
        },
        {
          title: 'Zero Liquid Discharge (ZLD) for Select Industries',
          details: 'Textile, electroplating, and chemical industries must implement ZLD to prevent groundwater contamination and air emissions from effluent treatment.',
          authority: 'KSPCB',
          status: 'Active'
        }
      ]
    },
    {
      category: 'Waste Burning & Biomass',
      icon: <Flame className="h-6 w-6 text-rose-500" />,
      color: 'rose',
      description: 'Open burning of municipal solid waste, agricultural residue, and leaf litter contributes episodic PM2.5 and toxic pollutants.',
      policies: [
        {
          title: 'Ban on Open Waste Burning',
          details: 'Complete prohibition under Air (Prevention and Control of Pollution) Act, 1981. FIRs filed against violators; ₹5,000 fine for first offense.',
          authority: 'CPCB, KSPCB, Local Police',
          status: 'Active'
        },
        {
          title: 'Decentralized Waste Processing',
          details: 'Ward-level dry waste collection centers (DWCCs) and composting units to prevent accumulation and burning. Target: 100% source segregation by end of 2024.',
          authority: 'BBMP Solid Waste Management',
          status: 'Ongoing'
        },
        {
          title: 'Awareness Campaigns',
          details: 'Public education on health impacts of waste burning. SMS alerts and social media campaigns during October-February (peak biomass burning season).',
          authority: 'BBMP, KSPCB, NGO Partners',
          status: 'Ongoing'
        }
      ]
    }
  ];

  const resources = [
    {
      title: 'National Clean Air Programme (NCAP)',
      description: 'Central government initiative targeting 20-30% reduction in PM2.5 and PM10 by 2024 in 132 non-attainment cities including Bengaluru.',
      link: 'https://moef.gov.in/ncap',
      icon: <Wind className="h-5 w-5" />
    },
    {
      title: 'Karnataka State Action Plan on Climate Change',
      description: 'Sectoral strategies for air quality improvement integrated with climate mitigation and adaptation measures.',
      link: 'https://karnataka.gov.in/environment',
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: 'CPCB Air Quality Standards',
      description: 'National Ambient Air Quality Standards (NAAQS) and real-time monitoring data from CPCB network.',
      link: 'https://cpcb.nic.in',
      icon: <Scale className="h-5 w-5" />
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          border: 'border-blue-500',
          bg: 'bg-blue-500/10',
          text: 'text-blue-600 dark:text-blue-400'
        };
      case 'amber':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/10',
          text: 'text-amber-600 dark:text-amber-400'
        };
      case 'purple':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-500/10',
          text: 'text-purple-600 dark:text-purple-400'
        };
      case 'rose':
        return {
          border: 'border-rose-500',
          bg: 'bg-rose-500/10',
          text: 'text-rose-600 dark:text-rose-400'
        };
      default:
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-600 dark:text-emerald-400'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4">
          <Building2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
          Government Action & Policy
        </h1>
        <p className="text-lg text-[#86868b] dark:text-[#98989d] mt-4 leading-relaxed">
          Comprehensive overview of regulatory frameworks, active interventions, and policy levers deployed by CPCB, 
          KSPCB, and BBMP to manage air quality in Bengaluru.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 p-5 rounded-r-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-300 mb-1">
              Policy Information
            </p>
            <p className="text-blue-800 dark:text-blue-400 leading-relaxed">
              The policies listed represent current and proposed measures as of 2024-2026. Implementation timelines and 
              enforcement vary by jurisdiction. For official updates, refer to CPCB and KSPCB notifications.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
          Interventions by Source Category
        </h2>
        
        {interventions.map((intervention) => {
          const colors = getColorClasses(intervention.color);
          return (
            <div
              key={intervention.category}
              className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-3xl overflow-hidden border border-[#e5e5ea] dark:border-white/10 transition-colors duration-300"
            >
              <div className={`p-6 border-b border-[#e5e5ea] dark:border-white/10 ${colors.bg} flex items-start gap-4`}>
                <div className={`p-3 bg-white dark:bg-white/10 rounded-2xl ${colors.border} border-2`}>
                  {intervention.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold tracking-tight mb-2 ${colors.text}`}>
                    {intervention.category}
                  </h3>
                  <p className="text-[#86868b] dark:text-[#98989d] text-sm leading-relaxed">
                    {intervention.description}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {intervention.policies.map((policy, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <h4 className="text-[#1d1d1f] dark:text-white font-semibold text-base">
                        {policy.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        policy.status === 'Active' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                          : policy.status === 'Ongoing'
                          ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                          : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                      }`}>
                        {policy.status}
                      </span>
                    </div>
                    <p className="text-[#86868b] dark:text-[#98989d] text-sm leading-relaxed">
                      {policy.details}
                    </p>
                    <p className="text-xs text-[#86868b] dark:text-[#98989d] font-mono">
                      <span className="font-semibold">Authority:</span> {policy.authority}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#f5f5f7] dark:bg-[#1c1c1e] rounded-3xl p-8 border border-[#e5e5ea] dark:border-white/10 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mb-6 flex items-center gap-3">
          <ExternalLink className="h-6 w-6 text-emerald-500" />
          Official Resources & Citations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-3 p-4 bg-white dark:bg-white/5 border border-[#e5e5ea] dark:border-white/10 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  {resource.icon}
                </div>
                <ExternalLink className="h-4 w-4 text-[#86868b] dark:text-[#98989d] ml-auto" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1d1d1f] dark:text-white text-sm mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] leading-relaxed">
                  {resource.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-[#86868b]/10 dark:bg-white/5 border border-[#86868b]/20 dark:border-white/10 rounded-2xl p-6">
        <p className="text-sm text-[#86868b] dark:text-[#98989d] leading-relaxed">
          <span className="font-semibold text-[#1d1d1f] dark:text-white">Disclaimer:</span> This page provides a synthesis 
          of publicly available policy documents and regulatory measures. It does not constitute legal advice. For compliance 
          requirements and enforcement details, consult CPCB (Central Pollution Control Board), KSPCB (Karnataka State Pollution 
          Control Board), or BBMP (Bruhat Bengaluru Mahanagara Palike) directly.
        </p>
      </div>
    </div>
  );
}
