import { BookOpen, Target, FileSearch, Database, Cpu, Users, MapPin } from 'lucide-react';
import { getStations, getHistorical } from '@/lib/api';
import { AQIMapWrapper } from '@/components/AQIMapWrapper';

export default async function AboutPage() {
  const stations = await getStations();
  const stationsData = await Promise.all(
    stations.map(async (station) => {
      const historical = await getHistorical(station.id);
      return {
        station,
        latestReading: historical[0] || null,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">Methodology & Research</h1>
        <p className="text-lg text-[#86868b] dark:text-[#98989d] max-w-2xl mx-auto">
          An overview of the machine learning pipeline, data sources, and objectives behind the Bengaluru AQI prediction platform.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        
        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Problem Statement & Objectives</h2>
          </div>
          <div className="prose prose-slate max-w-none text-[#86868b] dark:text-[#98989d] space-y-4 dark:prose-invert">
            <p>
              Bengaluru, like many rapidly growing metropolitan areas, faces significant challenges with air quality. Rapid urbanization, increasing vehicular density, and construction activities contribute to fluctuating and often hazardous levels of particulate matter and gaseous pollutants.
            </p>
            <p>
              <strong>Objective:</strong> To develop a robust, explainable machine learning model capable of accurately predicting the Air Quality Index (AQI) based on historical and real-time pollutant concentrations, and to provide a platform for policymakers to simulate the impact of targeted emission reduction interventions.
            </p>
          </div>
        </section>

        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Methodology Pipeline</h2>
          </div>
          
          <div className="bg-[#e5e5ea] dark:bg-white/5 p-8 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-center text-center gap-4">
              
              <div className="flex-1">
                <div className="bg-white dark:bg-white/10 h-16 w-16 mx-auto rounded-full flex items-center justify-center shadow-sm mb-4 text-indigo-500 dark:text-indigo-400 transition-colors">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] dark:text-white text-sm">CPCB Data</h3>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">Data collection & cleaning</p>
              </div>

              <div className="hidden md:block text-[#86868b] dark:text-[#98989d]">→</div>
              <div className="md:hidden text-[#86868b] dark:text-[#98989d]">↓</div>

              <div className="flex-1">
                <div className="bg-white dark:bg-white/10 h-16 w-16 mx-auto rounded-full flex items-center justify-center shadow-sm mb-4 text-rose-500 dark:text-rose-400 transition-colors">
                  <FileSearch className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] dark:text-white text-sm">Feature Eng.</h3>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">Imputation & extraction</p>
              </div>

              <div className="hidden md:block text-[#86868b] dark:text-[#98989d]">→</div>
              <div className="md:hidden text-[#86868b] dark:text-[#98989d]">↓</div>

              <div className="flex-1">
                <div className="bg-white dark:bg-white/10 h-16 w-16 mx-auto rounded-full flex items-center justify-center shadow-sm mb-4 text-emerald-500 dark:text-emerald-400 transition-colors">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] dark:text-white text-sm">ML Models</h3>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">XGBoost training</p>
              </div>

              <div className="hidden md:block text-[#86868b] dark:text-[#98989d]">→</div>
              <div className="md:hidden text-[#86868b] dark:text-[#98989d]">↓</div>

              <div className="flex-1">
                <div className="bg-white dark:bg-white/10 h-16 w-16 mx-auto rounded-full flex items-center justify-center shadow-sm mb-4 text-amber-500 dark:text-amber-400 transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-[#1d1d1f] dark:text-white text-sm">XAI / SHAP</h3>
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1">Explainability</p>
              </div>

            </div>
          </div>
        </section>

        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Key Findings & Research Gap</h2>
          </div>
          <div className="prose prose-slate max-w-none text-[#86868b] dark:text-[#98989d] space-y-4 dark:prose-invert">
            <p>
              <strong>Research Gap:</strong> While many studies focus on forecasting AQI as a black-box metric, there is a lack of localized platforms that provide both <em>explainability</em> (why the model predicted a certain value) and <em>actionability</em> (simulating the effect of policy interventions).
            </p>
            <p>
              <strong>Key Findings:</strong> Our analysis revealed that PM2.5 and PM10 are consistently the primary drivers of poor air quality in Bengaluru, particularly during the winter months. The XGBoost model demonstrated the highest predictive accuracy (R² = 0.91), successfully capturing non-linear relationships between vehicular emissions (NO₂) and secondary pollutant formation.
            </p>
          </div>
        </section>

        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#e5e5ea] dark:bg-white/10 text-[#86868b] dark:text-white rounded-2xl">
              <FileSearch className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Project Info</h2>
          </div>
          <div className="text-[#86868b] dark:text-[#98989d] text-sm leading-relaxed">
            <p className="mb-2"><strong>Dataset:</strong> Central Pollution Control Board (CPCB) India historical records (2020-2023).</p>
            <p className="mb-2"><strong>Domain:</strong> Environmental Data Science & Machine Learning.</p>
            <p><strong>Status:</strong> Prototype / Demo Version.</p>
          </div>
        </section>

        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#e5e5ea] dark:bg-white/10 text-[#86868b] dark:text-white rounded-2xl">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Team</h2>
          </div>
          <div className="text-[#86868b] dark:text-[#98989d] text-sm leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
              <p className="font-bold text-[#1d1d1f] dark:text-white text-base">Mohammed Mustafiz Khan</p>
              <p className="mt-1">Frontend</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
              <p className="font-bold text-[#1d1d1f] dark:text-white text-base">Nayan Utkarsh</p>
              <p className="mt-1">Backend</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
              <p className="font-bold text-[#1d1d1f] dark:text-white text-base">Kunal Reddy</p>
              <p className="mt-1">Research</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
              <p className="font-bold text-[#1d1d1f] dark:text-white text-base">Ganesh Kumar</p>
              <p className="mt-1">Model Training</p>
            </div>
          </div>
        </section>
        <section className="bg-[#f5f5f7] dark:bg-[#1c1c1e] p-8 md:p-10 rounded-3xl transition-colors duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <MapPin className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">Bengaluru AQI Live Network</h2>
          </div>
          <div className="prose prose-slate max-w-none text-[#86868b] dark:text-[#98989d] space-y-4 dark:prose-invert mb-8">
            <p>
              An interactive overview of our live monitoring network across Bengaluru. 
              The map below displays real-time readings sourced directly from the backend server.
            </p>
          </div>
          
          <div className="h-[450px] w-full relative z-0">
            <AQIMapWrapper stationsData={stationsData} />
          </div>
        </section>

      </div>
    </div>
  );
}
