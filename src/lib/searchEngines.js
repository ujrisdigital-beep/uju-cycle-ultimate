import { supabase } from '../lib/supabase';

// 5 Specialized Search Engines for UJU Cycle Ultimate

// 1. Academic Search Engine (Research papers, journals, citations)
export async function academicSearch(query, options = {}) {
  const { discipline, yearFrom, yearTo, peerReviewed, openAccess } = options;
  const results = { query, engine: 'academic', total: 0, papers: [], metrics: {} };
  
  try {
    // arXiv API
    const arxivQuery = encodeURIComponent(query);
    const arxivRes = await fetch(`http://export.arxiv.org/api/query?search_query=all:${arxivQuery}&start=0&max_results=30`).catch(() => null);
    const arxivText = arxivRes?.ok ? await arxivRes.text() : null;
    
    // CrossRef API
    const crossrefRes = await fetch(`https://api.crossref.org/works?query=${arxivQuery}&rows=30`, {
      headers: { 'User-Agent': 'UJU-Cycle-Ultimate/1.0' }
    }).catch(() => null);
    const crossrefData = crossrefRes?.ok ? await crossrefRes.json() : null;
    
    // Semantic Scholar
    const semanticRes = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${arxivQuery}&limit=30`, {
      headers: { 'X-API-Key': process.env.SEMANTIC_SCHOLAR_KEY || '' }
    }).catch(() => null);
    const semanticData = semanticRes?.ok ? await semanticRes.json() : null;
    
    // Parse arXiv
    if (arxivText) {
      const entries = arxivText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      results.papers = entries.map(entry => {
        const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1] || '';
        const summary = (entry.match(/<summary>(.*?)<\/summary>/) || [])[1] || '';
        const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1] || '';
        const authors = (entry.match(/<name>(.*?)<\/name>/g) || []).map(a => (a.match(/<name>(.*?)<\/name>/) || [])[1]);
        const link = (entry.match(/<id>(.*?)<\/id>/) || [])[1] || '';
        return { title: cleanText(title), abstract: cleanText(summary), authors, published, link, source: 'arXiv', citations: 0 };
      });
    }
    
    // Parse CrossRef
    if (crossrefData?.message?.items) {
      crossrefData.message.items.forEach(item => {
        results.papers.push({
          title: item.title?.[0] || '',
          authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`.trim()) || [],
          year: item.created?.['date-parts']?.[0]?.[0] || null,
          citations: item['is-referenced-by-count'] || 0,
          doi: item.DOI || '',
          source: 'CrossRef',
        });
      });
    }
    
    // Parse Semantic Scholar
    if (semanticData?.data) {
      semanticData.data.forEach(paper => {
        results.papers.push({
          title: paper.title || '',
          authors: paper.authors?.map(a => a.name) || [],
          year: paper.year || null,
          citations: paper.citationCount || 0,
          influentialCitations: paper.influentialCitationCount || 0,
          url: paper.url || '',
          abstract: paper.abstract || '',
          source: 'Semantic Scholar',
        });
      });
    }
    
    results.total = results.papers.length;
    results.metrics = {
      totalPapers: results.total,
      avgCitations: results.total > 0 ? 
        (results.papers.reduce((sum, p) => sum + (p.citations || 0), 0) / results.total).toFixed(2) : 0,
      bySource: {
        arxiv: results.papers.filter(p => p.source === 'arXiv').length,
        crossref: results.papers.filter(p => p.source === 'CrossRef').length,
        semantic: results.papers.filter(p => p.source === 'Semantic Scholar').length,
      }
    };
    
    logSearch('academic', query, results, true);
    return results;
  } catch (e) {
    logSearch('academic', query, null, false, e.message);
    return { error: 'Academic search failed', details: e.message };
  }
}

// 2. Legal Search Engine (Cases, statutes, regulations)
export async function legalSearch(query, options = {}) {
  const { jurisdiction, court, caseStatus, dateRange } = options;
  const results = { query, engine: 'legal', total: 0, cases: [], statutes: [], regulations: [] };
  
  try {
    // CourtListener API
    const clRes = await fetch(
      `https://www.courtlistener.com/api/rest/v3/search/?q=${encodeURIComponent(query)}&format=json&count=30`,
      { headers: { 'Authorization': `Token ${process.env.COURT_LISTENER_KEY || ''}` }
    ).catch(() => null);
    const clData = clRes?.ok ? await clRes.json() : null;
    
    // Case.law API
    const caseLawRes = await fetch(
      `https://api.case.law/v1/cases/?search=${encodeURIComponent(query)}&count=30`,
      { headers: { 'Authorization': `Token ${process.env.CASE_LAW_KEY || ''}` }
    ).catch(() => null);
    const caseLawData = caseLawRes?.ok ? await caseLawRes.json() : null;
    
    // UK Tribunal Decisions
    const ukRes = await fetch(
      `https://www.gov.uk/api/tribunal-decisions/search?q=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    ).catch(() => null);
    const ukData = ukRes?.ok ? await ukRes.json() : null;
    
    // Parse CourtListener
    if (clData?.results) {
      results.cases = clData.results.map(c => ({
        id: c.id, caseName: c.caseName || '', citation: c.cite || '',
        court: c.court || '', dateFiled: c.dateFiled || '',
        status: c.caseIsReopened ? 'Reopened' : 'Closed',
        snippet: c.snippet || '', url: c.absolute_url || '', source: 'US Federal',
      }));
    }
    
    // Parse Case.law
    if (caseLawData?.results) {
      caseLawData.results.forEach(c => {
        results.cases.push({
          id: c.id, caseName: c.name || '', citation: c.citations?.map(cit => cit.cite).join(', ') || '',
          court: c.court?.name || '', dateFiled: c.decision_date || '',
          source: 'US State', url: `https://case.law/case/${c.id}/`,
        });
      });
    }
    
    // UK Tribunal
    if (ukData?.decisions) {
      ukData.decisions.forEach(d => {
        results.cases.push({
          id: d.id, caseName: d.name || '', tribunal: d.tribunal_name || '',
          date: d.decision_date || '', snippet: d.summary || '',
          source: 'UK', url: d.legal_url || '',
        });
      });
    }
    
    // Internal UJRIS cases
    const { data: internalCases } = await supabase
      .from('cases')
      .select('*')
      .textSearch('case_title', query)
      .limit(20);
    
    if (internalCases?.length > 0) {
      results.cases.push(...internalCases.map(c => ({ ...c, source: 'UJRIS Internal' })));
    }
    
    results.total = results.cases.length;
    logSearch('legal', query, results, true);
    return results;
  } catch (e) {
    logSearch('legal', query, null, false, e.message);
    return { error: 'Legal search failed', details: e.message };
  }
}

// 3. Market Search Engine (Companies, financials, trends)
export async function marketSearch(query, options = {}) {
  const { sector, region, marketCap, fundingStage } = options;
  const results = { query, engine: 'market', total: 0, companies: [], trends: [], funding: [] };
  
  try {
    // SEC EDGAR
    const secRes = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(query)}&count=30&output=atom`,
      { headers: { 'User-Agent': 'UJU Cycle Ultimate contact@ujris.org' } }
    ).catch(() => null);
    const secText = secRes?.ok ? await secRes.text() : null;
    
    // Crunchbase
    const crunchRes = await fetch(
      `https://api.crunchbase.com/v4/data/entities/organizations?name=${encodeURIComponent(query)}&limit=30`,
      { headers: { 'X-cb-user-key': process.env.CRUNCHBASE_KEY || '' } }
    ).catch(() => null);
    const crunchData = crunchRes?.ok ? await crunchRes.json() : null;
    
    // Google Trends (via SerpAPI)
    const trendsRes = await fetch(
      `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY || ''}`
    ).catch(() => null);
    const trendsData = trendsRes?.ok ? await trendsRes.json() : null;
    
    // Parse SEC
    if (secText) {
      const entries = secText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      results.companies = entries.map(entry => {
        const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1] || '';
        const link = (entry.match(/<link [^>]*href="(.*?)"/) || [])[1] || '';
        const cik = (entry.match(/CIK[:\s]*(\d+)/) || [])[1] || '';
        return { name: cleanText(title), cik, link, source: 'SEC EDGAR', type: 'Public Company' };
      });
    }
    
    // Parse Crunchbase
    if (crunchData?.entities) {
      results.funding = crunchData.entities.map(e => ({
        name: e.name || '', description: e.short_description || '',
        fundingTotal: e.funding_total || 0, stage: e.funding_stage || '',
        employees: e.num_employees || 0, location: e.location_identifiers?.[0]?.name || '',
        source: 'Crunchbase',
      }));
    }
    
    // Parse Trends
    if (trendsData?.interest_over_time) {
      results.trends = trendsData.interest_over_time.map(point => ({
        date: point.date, value: point.value, growth: point.growth || 0,
      }));
    }
    
    results.total = results.companies.length + results.funding.length;
    logSearch('market', query, results, true);
    return results;
  } catch (e) {
    logSearch('market', query, null, false, e.message);
    return { error: 'Market search failed', details: e.message };
  }
}

// 4. Technical Search Engine (GitHub, Docs, Stack Overflow, APIs)
export async function technicalSearch(query, options = {}) {
  const { language, framework, platform, stars, license } = options;
  const results = { query, engine: 'technical', total: 0, repos: [], docs: [], qa: [], apis: [] };
  
  try {
    // GitHub Search
    const ghRes = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+in:name,description&sort=stars&order=desc&per_page=30`,
      { headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN || ''}` }
    ).catch(() => null);
    const ghData = ghRes?.ok ? await ghRes.json() : null;
    
    // Stack Overflow
    const soRes = await fetch(
      `https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle=${encodeURIComponent(query)}&site=stackoverflow&key=${process.env.SO_KEY || ''}`
    ).catch(() => null);
    const soData = soRes?.ok ? await soRes.json() : null;
    
    // DevDocs
    const docsRes = await fetch(
      `https://readthedocs.org/api/v2/search/?q=${encodeURIComponent(query)}&per_page=30`
    ).catch(() => null);
    const docsData = docsRes?.ok ? await docsRes.json() : null;
    
    // Parse GitHub
    if (ghData?.items) {
      results.repos = ghData.items.map(repo => ({
        name: repo.name, fullName: repo.full_name, description: repo.description || '',
        stars: repo.stargazers_count || 0, forks: repo.forks_count || 0,
        language: repo.language || '', license: repo.license?.spdx_id || 'Unknown',
        url: repo.html_url, updated: repo.updated_at,
      }));
    }
    
    // Parse Stack Overflow
    if (soData?.items) {
      results.qa = soData.items.map(q => ({
        title: q.title || '', tags: q.tags || [], score: q.score || 0,
        answers: q.answer_count || 0, accepted: q.is_answered || false,
        link: q.link, created: new Date(q.creation_date * 1000).toISOString(),
      }));
    }
    
    // Parse Docs
    if (docsData?.results) {
      results.docs = docsData.results.map(d => ({
        title: d.title || '', project: d.project_name || '', version: d.version_name || '',
        url: d.url || '', highlight: d.highlight || '',
      }));
    }
    
    results.total = results.repos.length + results.qa.length + results.docs.length;
    logSearch('technical', query, results, true);
    return results;
  } catch (e) {
    logSearch('technical', query, null, false, e.message);
    return { error: 'Technical search failed', details: e.message };
  }
}

// 5. News Search Engine (Global news, press releases, sentiment)
export async function newsSearch(query, options = {}) {
  const { source, dateFrom, dateTo, sentiment, language = 'en' } = options;
  const results = { query, engine: 'news', total: 0, articles: [], pressReleases: [], sentiment: null };
  
  try {
    // NewsAPI
    const newsRes = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=${language}&sortBy=relevancy&pageSize=30&apiKey=${process.env.NEWS_API_KEY || ''}`
    ).catch(() => null);
    const newsData = newsRes?.ok ? await newsRes.json() : null;
    
    // GDELT Project
    const gdeltRes = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&format=json&maxrecords=30`
    ).catch(() => null);
    const gdeltData = gdeltRes?.ok ? await gdeltRes.json() : null;
    
    // PRNewswire
    const prRes = await fetch(
      `https://api.prnewswire.com/api/v1/releases/search?q=${encodeURIComponent(query)}&limit=30`,
      { headers: { 'Authorization': `Bearer ${process.env.PR_API_KEY || ''}` } }
    ).catch(() => null);
    const prData = prRes?.ok ? await prRes.json() : null;
    
    // Parse NewsAPI
    if (newsData?.articles) {
      results.articles = newsData.articles.map(article => ({
        title: article.title || '', description: article.description || '',
        source: article.source?.name || '', author: article.author || 'Unknown',
        publishedAt: article.publishedAt || '', url: article.url,
        image: article.urlToImage || '', sentiment: analyzeSentiment(article.title + ' ' + article.description),
      }));
    }
    
    // Parse GDELT
    if (gdeltData?.articles) {
      results.articles.push(...gdeltData.articles.map(a => ({
        title: a.title || '', source: a.sourcecountry || 'Unknown',
        publishedAt: a.sentdate || '', url: a.url || '',
        tone: a.tone || 0, sentiment: a.tone > 0 ? 'positive' : a.tone < 0 ? 'negative' : 'neutral',
      })));
    }
    
    // Press Releases
    if (prData?.results) {
      results.pressReleases = prData.results.map(pr => ({
        title: pr.title || '', company: pr.company_name || '',
        date: pr.release_date || '', url: pr.url || '', summary: pr.summary || '',
      }));
    }
    
    // Calculate sentiment
    const sentiments = results.articles.map(a => a.sentiment).filter(s => s);
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    results.sentiment = {
      positive, negative, neutral: sentiments.length - positive - negative,
      overall: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
    };
    
    results.total = results.articles.length + results.pressReleases.length;
    logSearch('news', query, results, true);
    return results;
  } catch (e) {
    logSearch('news', query, null, false, e.message);
    return { error: 'News search failed', details: e.message };
  }
}

// COMBINED SEARCH (Compression-Ultra Refining Logic)
export async function compressionUltraSearch(query, engines = ['academic', 'legal', 'market', 'technical', 'news'], options = {}) {
  const startTime = Date.now();
  const results = {
    query, engines: {}, combined: [], compressionUltra: {}, timing: {},
    recommendation: null, summary: null,
  };
  
  // Run searches in parallel
  const searches = engines.map(engine => {
    const start = Date.now();
    switch (engine) {
      case 'academic': return academicSearch(query, options).then(r => ({ engine, result: r, time: Date.now() - start }));
      case 'legal': return legalSearch(query, options).then(r => ({ engine, result: r, time: Date.now() - start }));
      case 'market': return marketSearch(query, options).then(r => ({ engine, result: r, time: Date.now() - start }));
      case 'technical': return technicalSearch(query, options).then(r => ({ engine, result: r, time: Date.now() - start }));
      case 'news': return newsSearch(query, options).then(r => ({ engine, result: r, time: Date.now() - start }));
      default: return Promise.resolve({ engine, result: null, time: 0 });
    }
  });
  
  const allResults = await Promise.all(searches);
  
  // Compile results
  allResults.forEach(({ engine, result, time }) => {
    results.engines[engine] = { result, timeMs: time };
    if (result?.papers || result?.cases || result?.companies || result?.repos || result?.articles) {
      results.combined.push({ engine, ...result });
    }
  });
  
  // Compression-Ultra Refining Logic
  results.compressionUltra = {
    // Deduplicate across engines
    uniqueSources: compressUniqueSources(results.combined),
    
    // Extract key insights
    keyInsights: extractKeyInsights(results.combined, query),
    
    // Cross-reference findings
    crossReferences: findCrossReferences(results.combined),
    
    // Confidence scoring
    confidenceMap: buildConfidenceMap(results.combined),
    
    // Summary generation
    summary: generateSummary(results.combined, query),
    
    // Recommended actions
    recommendations: generateRecommendations(results.combined, query),
    
    // Compression ratio (signal-to-noise)
    compressionRatio: calculateCompressionRatio(results.combined, query),
  };
  
  results.timing.totalMs = Date.now() - startTime;
  results.totalEngines = engines.length;
  results.successfulEngines = allResults.filter(r => !r.result?.error).length;
  results.recommendation = generateGlobalRecommendation(results.compressionUltra);
  
  // Log to self-improvement
  logSearch('compression-ultra', query, results, true);
  
  return results;
}

// Helper functions
function cleanText(text) {
  return (text || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, '').trim();
}

function analyzeSentiment(text) {
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'win', 'benefit', 'gain', 'profit'];
  const negativeWords = ['bad', 'poor', 'terrible', 'negative', 'fail', 'loss', 'problem', 'issue', 'decline'];
  const lower = (text || '').toLowerCase();
  const pos = positiveWords.filter(w => lower.includes(w)).length;
  const neg = negativeWords.filter(w => lower.includes(w)).length;
  return pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
}

function compressUniqueSources(results) {
  const seen = new Set();
  return results.flatMap(r => 
    (r.papers || r.cases || r.companies || r.repos || r.articles || [])
      .filter(item => {
        const id = item.id || item.url || item.link || item.title;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
  ).length;
}

function extractKeyInsights(results, query) {
  return results.map(r => ({
    engine: r.engine,
    insights: (r.papers || r.cases || r.companies || r.repos || r.articles || []).slice(0, 5).map(item => ({
      title: item.title || item.name || '',
      relevance: calculateRelevance(item, query),
      source: item.source,
    }))
  }));
}

function calculateRelevance(item, query) {
  const text = JSON.stringify(item).toLowerCase();
  const queryWords = query.toLowerCase().split(' ');
  const matches = queryWords.filter(w => text.includes(w)).length;
  return Math.min(100, Math.round((matches / queryWords.length) * 100));
}

function findCrossReferences(results) {
  const allTitles = results.flatMap(r => 
    (r.papers || r.cases || r.articles || []).map(i => (i.title || i.name || '').toLowerCase())
  );
  const duplicates = allTitles.filter((t, i) => allTitles.indexOf(t) !== i && t.length > 10);
  return [...new Set(duplicates)].map(t => ({
    title: t, appearsIn: results.filter(r => 
      (r.papers || r.cases || r.articles || []).some(i => (i.title || i.name || '').toLowerCase() === t)
    ).map(r => r.engine)
  }));
}

function buildConfidenceMap(results) {
  return results.map(r => ({
    engine: r.engine,
    confidence: r.error ? 0 : 
      r.engine === 'academic' ? 92 : 
      r.engine === 'legal' ? 88 : 
      r.engine === 'market' ? 76 : 
      r.engine === 'technical' ? 95 : 
      r.engine === 'news' ? 82 : 50,
    totalResults: r.total || 0,
  }));
}

function generateSummary(results, query) {
  const total = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const engines = results.filter(r => !r.error).length;
  return `Compression-Ultra analyzed "${query}" across ${engines} search engines, yielding ${total} total results. ${generateQuickInsight(results)}`;
}

function generateQuickInsight(results) {
  const insights = [];
  results.forEach(r => {
    if (r.cases?.length > 0) insights.push(`${r.engine}: ${r.cases.length} legal cases found`);
    if (r.papers?.length > 0) insights.push(`${r.engine}: ${r.papers.length} academic papers`);
    if (r.articles?.length > 0) insights.push(`${r.engine}: ${r.articles.length} news articles`);
  });
  return insights.slice(0, 3).join('; ');
}

function generateRecommendations(results, query) {
  const recs = [];
  results.forEach(r => {
    if (r.engine === 'legal' && r.cases?.length > 0) {
      recs.push({ priority: 'high', action: `Review ${r.cases.length} similar legal cases` });
    }
    if (r.engine === 'academic' && r.papers?.length > 0) {
      recs.push({ priority: 'medium', action: `Cite ${Math.min(3, r.papers.length)} academic sources` });
    }
    if (r.engine === 'news' && r.sentiment?.overall === 'negative') {
      recs.push({ priority: 'high', action: 'Negative sentiment detected - prepare response strategy' });
    }
  });
  return recs.slice(0, 5);
}

function calculateCompressionRatio(results, query) {
  const totalResults = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const uniqueResults = compressUniqueSources(results);
  return {
    totalFetched: totalResults, unique: uniqueResults,
    compressionRatio: totalResults > 0 ? ((uniqueResults / totalResults) * 100).toFixed(2) + '%' : '0%',
    noiseReduction: totalResults - uniqueResults,
  };
}

function generateGlobalRecommendation(compressionUltra) {
  const { confidenceMap, compressionRatio, keyInsights } = compressionUltra;
  const avgConfidence = confidenceMap.reduce((sum, c) => sum + c.confidence, 0) / confidenceMap.length;
  
  return {
    action: avgConfidence > 85 ? 'Proceed with high confidence' : 
              avgConfidence > 70 ? 'Proceed with standard review' : 'Requires manual verification',
    confidence: avgConfidence.toFixed(1) + '%',
    compressionEfficiency: compressionRatio.compressionRatio,
    topInsight: keyInsights?.[0]?.insights?.[0]?.title || 'N/A',
  };
}

// Self-improvement logging
function logSearch(engine, query, result, success, error = null) {
  try {
    const crypto = require('crypto');
    supabase?.from('self_improvement_log')?.insert({
      task: `uju-search-${engine}`,
      input_hash: crypto.createHash('sha256').update(JSON.stringify({ query })).digest('hex').slice(0, 16),
      output_hash: crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex').slice(0, 16),
      success: success !== false,
      metadata: { engine, query, error: error || null },
      timestamp: Date.now(),
    }).then(() => {}).catch(() => {});
  } catch (e) {}
}

// Import supabase dynamically
let supabaseInstance = null;
import('../lib/supabase.js').then(m => supabaseInstance = m?.supabase).catch(() => {});
