export interface Article {
  id: number;
  slug: string;
  category: string;
  categoryColor: string;
  title: string;
  abstract: string;
  content: string; // markdown-like HTML
  date: string;
  readTime: string;
  image: string;
  author: string;
  authorRole: string;
  tags: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    slug: "rag-vs-fine-tuning-llm-production",
    category: "INTELLIGENCE ARTIFICIELLE",
    categoryColor: "#8b5cf6",
    title: "RAG vs Fine-tuning : quelle stratégie pour vos LLMs en production ?",
    abstract:
      "Le Retrieval-Augmented Generation (RAG) et le fine-tuning sont les deux grandes approches pour spécialiser un LLM sur votre domaine. RAG offre une mise à jour temps réel des connaissances sans coût de réentraînement, tandis que le fine-tuning améliore le style et la cohérence des réponses. On décortique les critères de choix : coût GPU, fraîcheur des données, latence et qualité attendue.",
    content: `
<h2>Pourquoi ne pas utiliser les deux ?</h2>
<p>La question RAG vs fine-tuning est souvent mal posée. Ces deux techniques ne s'excluent pas mutuellement — elles répondent à des problèmes différents. Le fine-tuning modifie les <strong>poids du modèle</strong> pour ancrer un style, un format ou des connaissances statiques. Le RAG, lui, augmente chaque inférence avec des <strong>documents récupérés dynamiquement</strong> depuis une base vectorielle.</p>

<h2>Quand choisir le RAG</h2>
<ul>
  <li><strong>Vos données changent fréquemment</strong> (documentation produit, prix, FAQ) — un re-training toutes les semaines est trop coûteux</li>
  <li><strong>Vous devez citer vos sources</strong> — le RAG permet d'injecter la source dans le contexte et de l'exposer à l'utilisateur</li>
  <li><strong>Budget GPU limité</strong> — pas besoin de GPU pour faire tourner du RAG sur un LLM via API</li>
</ul>

<h2>Quand choisir le fine-tuning</h2>
<ul>
  <li><strong>Style et format très spécifiques</strong> (réponses JSON structurées, ton juridique, output code dans un framework interne)</li>
  <li><strong>Connaissances figées et volumineuses</strong> que vous ne voulez pas passer dans le contexte à chaque appel (coût tokens)</li>
  <li><strong>Latence critique</strong> — un modèle fine-tuné + contexte court est plus rapide qu'un RAG avec retrieval</li>
</ul>

<h2>Architecture hybride recommandée</h2>
<p>En production, l'approche la plus robuste combine les deux :</p>
<ol>
  <li>Fine-tuner un modèle de base sur votre style/format (une seule fois)</li>
  <li>Ajouter une couche RAG pour les connaissances dynamiques</li>
  <li>Utiliser un reranker (Cohere Rerank, BGE Reranker) pour améliorer la pertinence des chunks récupérés</li>
</ol>

<h2>Métriques à surveiller</h2>
<p>Pour évaluer votre pipeline RAG, concentrez-vous sur :</p>
<ul>
  <li><strong>Recall@K</strong> : le bon chunk est-il dans les K résultats récupérés ?</li>
  <li><strong>Faithfulness</strong> : la réponse est-elle fondée sur les documents récupérés (pas d'hallucination) ?</li>
  <li><strong>Answer relevancy</strong> : la réponse répond-elle vraiment à la question ?</li>
</ul>
<p>Des frameworks comme <strong>RAGAS</strong> ou <strong>TruLens</strong> automatisent ces évaluations.</p>
    `,
    date: "8 mai 2026",
    readTime: "9 min",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&q=80",
    author: "Sarah M.",
    authorRole: "ML Engineer",
    tags: ["LLM", "RAG", "Fine-tuning", "NLP"],
  },
  {
    id: 2,
    slug: "dbt-airflow-spark-stack-data-moderne-2026",
    category: "DATA ENGINEERING",
    categoryColor: "#00b8d9",
    title: "dbt, Airflow, Spark : construire une stack data moderne en 2026",
    abstract:
      "Les pipelines de données ont radicalement évolué. L'approche ELT a remplacé l'ETL classique, dbt transforme le SQL en asset versionnable, et les architectures Lakehouse unifient le data lake et le data warehouse. Retour d'expérience sur une migration complète vers une stack Snowflake + dbt Core + Airflow + Great Expectations.",
    content: `
<h2>La fin de l'ETL classique</h2>
<p>Pendant des années, le pattern ETL (Extract → Transform → Load) dominait. La transformation se faisait <em>avant</em> le chargement, dans des outils lourds comme Informatica ou DataStage. Aujourd'hui, avec la puissance de calcul des entrepôts cloud (Snowflake, BigQuery, Redshift), on charge d'abord les données brutes, puis on transforme directement en SQL. C'est l'<strong>ELT</strong>.</p>

<h2>dbt : le SQL comme asset de première classe</h2>
<p>dbt (data build tool) a révolutionné la façon dont les data engineers écrivent des transformations :</p>
<ul>
  <li><strong>Versioning Git</strong> de tous les modèles SQL</li>
  <li><strong>Tests automatiques</strong> (unicité, non-nullité, cohérence référentielle)</li>
  <li><strong>Documentation auto-générée</strong> avec lignage des données</li>
  <li><strong>Matérialisations</strong> : table, view, incremental, snapshot</li>
</ul>

<h2>Airflow pour l'orchestration</h2>
<p>Apache Airflow reste la référence pour orchestrer les pipelines complexes. Avec Airflow 2.x, les DAGs en Python sont plus lisibles, le scheduler est plus robuste, et l'intégration avec dbt est native via <code>DbtTaskGroup</code>.</p>

<h2>Great Expectations pour la qualité</h2>
<p>Great Expectations permet de définir des "expectations" sur vos données (ex: "la colonne user_id ne contient jamais de NULL", "le chiffre d'affaires est toujours positif") et de les vérifier à chaque run de pipeline. Un pipeline qui échoue silencieusement est bien plus dangereux qu'un pipeline qui lève une alerte.</p>

<h2>Les pièges à éviter</h2>
<ol>
  <li><strong>Trop de modèles éphémères</strong> (ephemeral) — ils rendent le debugging difficile</li>
  <li><strong>Pas de stratégie d'incrémentiels</strong> — recharger 3 ans de données à chaque run tue les coûts</li>
  <li><strong>Ignorer le data lineage</strong> — vous perdrez des heures à tracer l'origine d'une anomalie</li>
</ol>
    `,
    date: "5 mai 2026",
    readTime: "11 min",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    author: "Karim B.",
    authorRole: "Data Engineer Senior",
    tags: ["dbt", "Airflow", "Snowflake", "ELT"],
  },
  {
    id: 3,
    slug: "mlops-monitoring-modeles-ml-production",
    category: "MLOPS",
    categoryColor: "#10b981",
    title: "MLflow, Evidently, Prometheus : monitorer vos modèles ML en production",
    abstract:
      "Un modèle déployé n'est pas un modèle terminé. Le data drift, le concept drift et la dégradation silencieuse des performances sont les ennemis invisibles du MLOps. Découvrez comment mettre en place une surveillance complète avec MLflow, Evidently AI et Grafana.",
    content: `
<h2>Le problème silencieux du drift</h2>
<p>Votre modèle de scoring de crédit avait 94% d'AUC au déploiement. Six mois plus tard, il en est à 81% — et personne ne s'en est rendu compte parce qu'il n'y avait pas de monitoring. C'est le scénario classique du <strong>concept drift</strong> : la relation entre features et cible a changé dans le monde réel.</p>

<h2>Les trois types de drift à surveiller</h2>
<ul>
  <li><strong>Data drift</strong> : la distribution des features d'entrée a changé (ex: nouveaux segments clients)</li>
  <li><strong>Concept drift</strong> : la relation features → target a changé (ex: comportements post-COVID)</li>
  <li><strong>Prediction drift</strong> : la distribution des prédictions a changé sans explication</li>
</ul>

<h2>Evidently AI pour la détection de drift</h2>
<p>Evidently génère des rapports HTML ou JSON comparant votre dataset de référence (training) à la production récente. Il calcule automatiquement les tests statistiques appropriés (Jensen-Shannon divergence pour les distributions continues, Chi² pour les catégorielles).</p>

<h2>MLflow pour le tracking d'expériences</h2>
<p>Chaque réentraînement doit être tracé : hyperparamètres, métriques, artefacts, version du dataset. MLflow offre une UI simple pour comparer les runs et promouvoir un modèle en production via son Model Registry.</p>

<h2>Stack de monitoring opérationnel</h2>
<p>Pour les métriques système (latence p99, throughput, erreurs) : exposez un endpoint <code>/metrics</code> Prometheus depuis votre service de scoring, et visualisez dans Grafana. Créez des alertes sur : latence > 200ms, taux d'erreur > 1%, drift score > seuil.</p>
    `,
    date: "2 mai 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    author: "Léa D.",
    authorRole: "MLOps Engineer",
    tags: ["MLOps", "MLflow", "Monitoring", "Drift"],
  },
  {
    id: 4,
    slug: "kubernetes-data-spark-kafka-flink",
    category: "CLOUD & INFRASTRUCTURE",
    categoryColor: "#f59e0b",
    title: "Kubernetes pour la Data : déployer Spark, Kafka et Flink sur K8s",
    abstract:
      "Kubernetes est devenu le standard pour les workloads data distribués. Spark on K8s remplace les clusters YARN figés, Kafka géré par Strimzi simplifie les opérations, et Flink offre du streaming sub-seconde. Cet article couvre les patterns d'architecture et les stratégies de résilience.",
    content: `
<h2>Pourquoi migrer vers K8s pour la data ?</h2>
<p>Les clusters YARN on-premise ou EMR préprovisionnés gaspillent des ressources. Avec Kubernetes, vous avez de l'élasticité réelle : un job Spark peut demander 50 executors le temps de son exécution, et les pods disparaissent une fois le job terminé. Vous payez ce que vous consommez.</p>

<h2>Spark on Kubernetes</h2>
<p>Depuis Spark 3.1, le support natif K8s est stable en production. Le pattern recommandé :</p>
<ul>
  <li>Utiliser l'<strong>Operator Spark</strong> (Kubeflow Spark Operator) pour déclarer les jobs en YAML</li>
  <li>Stocker les données sur <strong>S3/GCS/Azure Blob</strong> (pas de HDFS)</li>
  <li>Utiliser des <strong>Spot/Preemptible nodes</strong> pour les executors (économie 60-80%)</li>
</ul>

<h2>Kafka avec Strimzi</h2>
<p>Strimzi est l'operator Kafka officiel pour K8s. Il gère le cycle de vie complet : déploiement, rolling upgrades, TLS, monitoring Prometheus. Avec Cruise Control intégré, le rebalancing des partitions devient automatique.</p>

<h2>Flink pour le streaming temps-réel</h2>
<p>Apache Flink offre une garantie <strong>exactly-once</strong> en mode streaming avec une latence de quelques millisecondes. Sur K8s, le Flink Kubernetes Operator simplifie les déploiements en application mode ou session mode selon vos besoins.</p>

<h2>Gestion des ressources GPU</h2>
<p>Pour les workloads ML (feature extraction, inference batch), allouez des nodes GPU via des <code>nodeSelector</code> et <code>tolerations</code> spécifiques. Les Device Plugins NVIDIA permettent à K8s de scheduler intelligemment les GPU.</p>
    `,
    date: "28 avril 2026",
    readTime: "12 min",
    image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1200&q=80",
    author: "Nicolas P.",
    authorRole: "Cloud Architect",
    tags: ["Kubernetes", "Spark", "Kafka", "Flink"],
  },
  {
    id: 5,
    slug: "agents-ia-autonomes-langgraph",
    category: "INTELLIGENCE ARTIFICIELLE",
    categoryColor: "#8b5cf6",
    title: "Agents IA autonomes : architectures multi-agents avec LangGraph",
    abstract:
      "Les agents IA de 2026 planifient, utilisent des outils, s'auto-corrigent et collaborent entre eux. LangGraph apporte la notion de graphe d'états pour orchestrer des workflows complexes. On explore un cas concret : un agent de veille technologique automatique.",
    content: `
<h2>Pourquoi les chaînes LLM simples ne suffisent plus</h2>
<p>LangChain a popularisé les "chains" : une séquence linéaire d'appels LLM. Mais les tâches complexes nécessitent des <strong>boucles de réflexion</strong>, des <strong>décisions conditionnelles</strong> et la capacité de <strong>revenir en arrière</strong> si un outil échoue. C'est ce que LangGraph apporte avec son modèle de graphe d'états.</p>

<h2>Concepts clés de LangGraph</h2>
<ul>
  <li><strong>State</strong> : un objet TypedDict qui persiste tout au long de l'exécution du graphe</li>
  <li><strong>Nodes</strong> : des fonctions Python qui modifient l'état</li>
  <li><strong>Edges</strong> : des transitions conditionnelles entre nœuds</li>
  <li><strong>Checkpointing</strong> : sauvegarde de l'état pour reprendre ou débugger</li>
</ul>

<h2>Pattern ReAct (Reason + Act)</h2>
<p>Le pattern ReAct alterne entre :</p>
<ol>
  <li><strong>Thought</strong> : le LLM réfléchit à ce qu'il faut faire</li>
  <li><strong>Action</strong> : il appelle un outil (recherche web, calcul, API)</li>
  <li><strong>Observation</strong> : il observe le résultat de l'outil</li>
  <li>...jusqu'à atteindre un état final</li>
</ol>

<h2>Cas pratique : agent de veille technologique</h2>
<p>Notre agent utilise 4 outils : <code>web_search</code>, <code>fetch_page</code>, <code>summarize</code>, <code>classify_relevance</code>. Il reçoit une liste de sujets à surveiller, scrape les sources pertinentes chaque matin, résume et classe les articles, puis génère un rapport Markdown envoyé par email.</p>

<h2>Multi-agent : quand un seul agent ne suffit pas</h2>
<p>Pour les workflows très complexes, on décompose en plusieurs agents spécialisés avec un "supervisor" qui délègue les sous-tâches. LangGraph supporte nativement ce pattern avec des sous-graphes.</p>
    `,
    date: "24 avril 2026",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    author: "Amina F.",
    authorRole: "AI Engineer",
    tags: ["Agents", "LangGraph", "LLM", "Automation"],
  },
  {
    id: 6,
    slug: "causalite-vs-correlation-analyse-donnees",
    category: "DATA SCIENCE",
    categoryColor: "#ef4444",
    title: "Causalité vs corrélation : les erreurs classiques en analyse de données",
    abstract:
      "Les dashboards sont remplis de corrélations séduisantes qui masquent des biais de confusion. Le framework de Judea Pearl — DAGs causaux, do-calculus — permet de raisonner rigoureusement sur les effets réels. Cas réels en marketing et RH avec DoWhy et CausalML.",
    content: `
<h2>Le piège de la corrélation</h2>
<p>Une corrélation célèbre : les ventes de glaces et les noyades augmentent en même temps. Faut-il interdire les glaces pour sauver des vies ? Bien sûr que non — la chaleur estivale est la <strong>variable confondante</strong>. Ce genre de raisonnement naïf coûte cher en business : campagnes marketing mal attribuées, politiques RH contre-productives.</p>

<h2>Les DAGs causaux de Judea Pearl</h2>
<p>Un DAG (Directed Acyclic Graph) causal représente les hypothèses sur les relations de cause à effet entre variables. Il permet de :</p>
<ul>
  <li>Identifier quelles variables contrôler pour isoler un effet</li>
  <li>Détecter les <strong>colliders</strong> (variables qu'il ne faut surtout PAS contrôler)</li>
  <li>Formaliser ce qu'on veut mesurer avant de toucher aux données</li>
</ul>

<h2>DoWhy en pratique</h2>
<p>La librairie DoWhy (Microsoft) implémente le framework de Pearl en Python. Le workflow en 4 étapes : <strong>Model</strong> (définir le DAG) → <strong>Identify</strong> (trouver l'estimand causal) → <strong>Estimate</strong> (calculer l'effet) → <strong>Refute</strong> (tester la robustesse).</p>

<h2>Exemple RH : l'effet des formations sur la performance</h2>
<p>Un manager observe que les employés formés performent mieux. Mais est-ce la formation qui cause la performance, ou les bons employés sont-ils simplement plus susceptibles de suivre des formations (biais de sélection) ? Avec un modèle causal et la méthode des variables instrumentales, on peut isoler l'effet réel.</p>

<h2>Quand l'AB test n'est pas possible</h2>
<p>L'AB test est le gold standard, mais il est souvent impossible (éthique, coût, délai). Les méthodes d'<strong>inférence causale observationnelle</strong> — Difference-in-Differences, Regression Discontinuity, Propensity Score Matching — permettent d'estimer des effets causaux sans randomisation.</p>
    `,
    date: "20 avril 2026",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80",
    author: "Thomas R.",
    authorRole: "Data Scientist",
    tags: ["Causalité", "DoWhy", "Stats", "Biais"],
  },
  {
    id: 7,
    slug: "vector-databases-pinecone-weaviate-pgvector",
    category: "INTELLIGENCE ARTIFICIELLE",
    categoryColor: "#8b5cf6",
    title: "Vector databases : Pinecone, Weaviate ou pgvector — laquelle choisir ?",
    abstract:
      "Les bases de données vectorielles sont au cœur de tout système RAG moderne. Pinecone est managé et simple, Weaviate est open-source et riche en fonctionnalités, pgvector s'intègre directement dans PostgreSQL. Comparatif complet avec benchmarks de latence et coûts.",
    content: `
<h2>Pourquoi une base vectorielle ?</h2>
<p>La recherche sémantique repose sur la comparaison de vecteurs d'embeddings dans un espace à haute dimension (768, 1536 ou 3072 dimensions selon le modèle). Une base vectorielle indexe ces vecteurs avec des algorithmes ANN (Approximate Nearest Neighbor) comme <strong>HNSW</strong> ou <strong>IVF</strong> pour des recherches sub-milliseconde sur des millions de vecteurs.</p>

<h2>Pinecone : la solution managée</h2>
<p>Pinecone est <strong>serverless</strong> depuis 2024 : vous payez par requête, pas par heure de serveur. C'est idéal pour les MVPs et les charges variables. Pas de configuration d'index à gérer, une API simple, mais dépendance à un service tiers et coûts qui montent vite à grande échelle.</p>

<h2>Weaviate : la puissance open-source</h2>
<p>Weaviate combine recherche vectorielle et recherche par mots-clés (BM25) dans un seul index hybride. Il intègre nativement des modules de vectorisation (OpenAI, Cohere, HuggingFace) et supporte le GraphQL. Auto-hébergeable sur Kubernetes ou via Weaviate Cloud Services.</p>

<h2>pgvector : pragmatisme PostgreSQL</h2>
<p>Si vous avez déjà PostgreSQL (comme Supabase), l'extension pgvector est souvent le meilleur choix pour commencer. Vous évitez une infrastructure supplémentaire, bénéficiez des transactions ACID, et pouvez faire des <strong>joins SQL hybrides</strong> (filtres métier + similarité vectorielle). Supabase l'active en un clic.</p>

<h2>Verdict</h2>
<ul>
  <li><strong>MVP / équipe petite</strong> : pgvector sur Supabase</li>
  <li><strong>Prod avec volumes > 10M vecteurs</strong> : Pinecone serverless ou Weaviate auto-hébergé</li>
  <li><strong>Besoin de multimodalité</strong> (texte + images) : Weaviate</li>
</ul>
    `,
    date: "15 avril 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=1200&q=80",
    author: "Sarah M.",
    authorRole: "ML Engineer",
    tags: ["Vector DB", "pgvector", "Pinecone", "RAG"],
  },
  {
    id: 8,
    slug: "data-mesh-decentraliser-gouvernance-donnees",
    category: "DATA ENGINEERING",
    categoryColor: "#00b8d9",
    title: "Data Mesh : décentraliser la gouvernance des données en pratique",
    abstract:
      "Le Data Mesh propose de traiter les données comme des produits, gérés par les équipes domaine. Mais comment passer de la théorie à la pratique ? Retour d'expérience sur une migration dans une entreprise de 800 personnes : organisation, outils, résistances et quick wins.",
    content: `
<h2>Le problème du data lake centralisé</h2>
<p>Le modèle centralisé — une équipe data qui gère tout le pipeline pour toute l'entreprise — ne passe pas à l'échelle. Goulet d'étranglement, priorités arbitrées entre 20 équipes métier, schema ownership flou, SLA impossibles à tenir. Zhamak Dehghani a théorisé le <strong>Data Mesh</strong> comme réponse architecturale.</p>

<h2>Les 4 principes fondateurs</h2>
<ol>
  <li><strong>Ownership domaine</strong> : chaque équipe métier possède ses données</li>
  <li><strong>Données comme produit</strong> : les datasets ont des SLA, une documentation, des owners</li>
  <li><strong>Infrastructure self-serve</strong> : les équipes domaine peuvent déployer sans aide centrale</li>
  <li><strong>Gouvernance fédérée</strong> : standards communs (schema, qualité, sécurité) sans centralisation excessive</li>
</ol>

<h2>Outils pour le Data Mesh</h2>
<p>Le <strong>Data Catalog</strong> (Datahub, Collibra, Alation) devient critique pour découvrir les data products des autres domaines. Le <strong>Data Contract</strong> (en YAML) formalise les engagements : schema, SLA de fraîcheur, owner, exemples.</p>

<h2>Résistances organisationnelles</h2>
<p>Le plus grand obstacle n'est pas technique. Les équipes métier ne veulent pas "gérer des données" — elles veulent des features. Le secret est de commencer avec des équipes volontaires, de montrer des quick wins (time-to-insight divisé par 3), et d'investir dans la plateforme self-serve avant d'exiger l'ownership.</p>
    `,
    date: "10 avril 2026",
    readTime: "9 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    author: "Karim B.",
    authorRole: "Data Engineer Senior",
    tags: ["Data Mesh", "Architecture", "Gouvernance", "Org"],
  },
  {
    id: 9,
    slug: "llm-quantization-gpu-inference",
    category: "INTELLIGENCE ARTIFICIELLE",
    categoryColor: "#8b5cf6",
    title: "LLM quantization : faire tourner un modèle 70B sur un seul GPU A100",
    abstract:
      "Les LLMs open-source (Llama 3, Mistral, Qwen) sont trop lourds en FP32 pour la plupart des infrastructures. La quantization réduit les poids à 4-8 bits sans dégradation majeure. Guide complet : GPTQ, AWQ, GGUF, bitsandbytes — et quel format pour quelle situation.",
    content: `
<h2>Pourquoi quantizer ?</h2>
<p>Un modèle 70B en FP16 occupe ~140 Go de VRAM — il faut 2 A100 80Go minimum. En INT4 (quantization 4 bits), on tombe à ~35 Go : un seul A100 suffit, avec une dégradation de perplexité inférieure à 2% sur les benchmarks classiques.</p>

<h2>GPTQ : quantization post-training</h2>
<p>GPTQ est l'algorithme de référence pour la quantization INT4/INT8. Il calibre les poids sur un petit dataset de calibration (128-512 exemples) puis quantize par layer en minimisant l'erreur. Compatible avec AutoGPTQ et intégré dans HuggingFace Transformers.</p>

<h2>AWQ : plus précis que GPTQ</h2>
<p>AWQ (Activation-aware Weight Quantization) identifie les "canaux saillants" — les dimensions qui influencent le plus les activations — et les préserve en précision plus haute. Résultat : meilleure qualité que GPTQ pour le même niveau de compression, et inférence plus rapide avec vLLM.</p>

<h2>GGUF : pour le CPU et les machines locales</h2>
<p>Le format GGUF (successeur de GGML) est optimisé pour l'inférence CPU via llama.cpp. Il permet de faire tourner un 7B quantisé en Q4_K_M sur un MacBook Pro M3 avec des performances acceptables (~15 tokens/s). Idéal pour le développement local ou les déploiements edge.</p>

<h2>Quel format choisir</h2>
<ul>
  <li><strong>GPU NVIDIA (prod)</strong> : AWQ + vLLM pour le throughput maximal</li>
  <li><strong>GPU NVIDIA (dev)</strong> : bitsandbytes NF4 (load_in_4bit=True) pour la simplicité</li>
  <li><strong>CPU / Apple Silicon</strong> : GGUF Q4_K_M via llama.cpp ou Ollama</li>
</ul>
    `,
    date: "5 avril 2026",
    readTime: "10 min",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    author: "Amina F.",
    authorRole: "AI Engineer",
    tags: ["LLM", "Quantization", "GPU", "Inference"],
  },
  {
    id: 10,
    slug: "prompt-engineering-avance-chain-of-thought",
    category: "INTELLIGENCE ARTIFICIELLE",
    categoryColor: "#8b5cf6",
    title: "Prompt engineering avancé : chain-of-thought, few-shot et structured outputs",
    abstract:
      "Le prompt engineering est devenu une compétence critique pour tout développeur qui intègre des LLMs. Au-delà des bases, les techniques avancées — chain-of-thought, self-consistency, structured outputs avec Pydantic — transforment la fiabilité des applications IA en production.",
    content: `
<h2>Pourquoi le prompt engineering reste important</h2>
<p>Même avec des modèles de plus en plus puissants, la façon dont vous formulez vos instructions détermine largement la qualité des sorties. Un bon prompt peut doubler la précision sur une tâche de classification complexe — sans coût supplémentaire de fine-tuning.</p>

<h2>Chain-of-Thought (CoT)</h2>
<p>En ajoutant simplement "Let's think step by step" (ou en français : "Raisonnons étape par étape"), on force le modèle à décomposer le problème avant de répondre. Les gains sont spectaculaires sur les tâches de raisonnement : +20 à +40% sur les benchmarks mathématiques pour les modèles GPT-4 classe.</p>

<h2>Self-Consistency : voter entre plusieurs raisonnements</h2>
<p>Au lieu d'une seule chaîne de pensée, on génère N raisonnements indépendants (temperature > 0) et on sélectionne la réponse majoritaire. Coûteux en tokens, mais très efficace pour les tâches critiques où l'erreur est inacceptable.</p>

<h2>Structured Outputs avec Pydantic</h2>
<p>Les LLMs modernes (GPT-4o, Claude 3.5+, Gemini) supportent le mode JSON forcé. Couplé à une librairie comme <strong>Instructor</strong> ou <strong>LangChain with_structured_output</strong>, vous pouvez déclarer un schéma Pydantic et obtenir des objets Python typés directement — sans parsing fragile du JSON.</p>

<h2>Few-shot : des exemples plutôt que des instructions</h2>
<p>Pour les tâches très spécifiques (classification dans une taxonomie propriétaire, extraction d'entités métier), 3 à 5 exemples input/output dans le prompt surpassent souvent une instruction longue et détaillée. La règle : montrez, ne dites pas.</p>
    `,
    date: "1 avril 2026",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1655635643532-fa9ba2648cbe?auto=format&fit=crop&w=1200&q=80",
    author: "Sarah M.",
    authorRole: "ML Engineer",
    tags: ["Prompt Engineering", "LLM", "CoT", "Structured Output"],
  },
  {
    id: 11,
    slug: "devops-freelance-terraform-ci-cd",
    category: "CLOUD & INFRASTRUCTURE",
    categoryColor: "#f59e0b",
    title: "DevOps freelance : monter une infra Terraform + CI/CD complète en 2 jours",
    abstract:
      "En tant que freelance IT, savoir livrer une infra-as-code complète et reproductible est un avantage concurrentiel majeur. Guide pratique pour bootstrapper une infra AWS/GCP avec Terraform, GitHub Actions, et monitoring intégré — le tout en moins de 48h.",
    content: `
<h2>L'infra minimale viable</h2>
<p>Pour la majorité des startups et PME, une infra robuste ne nécessite pas des semaines. Le strict minimum : un cloud provider (AWS/GCP/Azure), Terraform pour le provisioning, GitHub Actions pour le CI/CD, et un monitoring basique. Avec cette stack, vous pouvez aller de zéro à production en 2 jours.</p>

<h2>Structure Terraform recommandée</h2>
<p>Organisez votre code Terraform en modules réutilisables :</p>
<ul>
  <li><code>modules/networking</code> : VPC, subnets, security groups</li>
  <li><code>modules/compute</code> : ECS/GKE clusters, instances</li>
  <li><code>modules/database</code> : RDS/Cloud SQL avec backups automatiques</li>
  <li><code>envs/staging</code> et <code>envs/prod</code> : composition des modules</li>
</ul>

<h2>Pipeline GitHub Actions type</h2>
<p>Un pipeline minimal en 4 étapes : <strong>lint</strong> (terraform fmt + tflint) → <strong>plan</strong> (terraform plan avec commentaire PR automatique) → <strong>apply staging</strong> (auto sur merge) → <strong>apply prod</strong> (manuelle avec approbation). Ajoutez Checkov pour le scan de sécurité IaC.</p>

<h2>Estimer et facturer ce type de mission</h2>
<p>Une mission "setup DevOps complet" se facture entre 3 000€ et 8 000€ selon la complexité. Le TJM d'un DevOps senior tourne entre 600 et 800€/j. Présentez un devis en phases : audit (0.5j), design (1j), implémentation (3-5j), formation (1j). Documentez tout — c'est ce qui justifie votre prix.</p>
    `,
    date: "25 mars 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80",
    author: "Nicolas P.",
    authorRole: "Cloud Architect",
    tags: ["Terraform", "CI/CD", "DevOps", "Freelance"],
  },
  {
    id: 12,
    slug: "salaire-it-grilles-remuneration-2026",
    category: "MARCHÉ",
    categoryColor: "#10b981",
    title: "Salaires IT 2026 : les grilles de rémunération complètes par spécialité",
    abstract:
      "Data Engineer, ML Engineer, DevOps, Développeur Full-Stack, RSSI : quels sont les salaires réels en France en 2026 ? Enquête sur 2 400 profils, avec les disparités région/secteur, l'impact du remote et les bonus variables. Plus les TJM freelance par spécialité.",
    content: `
<h2>Méthodologie</h2>
<p>Cette étude agrège les données de 2 400 profils IT en France recrutés ou ayant changé de poste entre janvier et mars 2026. Sources : annonces avec salaire affiché, déclarations anonymes sur des forums spécialisés, et données de cabinets de recrutement partenaires.</p>

<h2>Salaires CDI par spécialité (médiane, Paris)</h2>
<ul>
  <li><strong>ML Engineer / AI Engineer</strong> : 65 000 – 95 000 €/an</li>
  <li><strong>Data Engineer Senior</strong> : 58 000 – 80 000 €/an</li>
  <li><strong>DevOps / SRE Senior</strong> : 60 000 – 85 000 €/an</li>
  <li><strong>Développeur Full-Stack Senior</strong> : 52 000 – 72 000 €/an</li>
  <li><strong>Product Manager Tech</strong> : 60 000 – 80 000 €/an</li>
  <li><strong>RSSI / Cybersécurité</strong> : 70 000 – 100 000 €/an</li>
</ul>

<h2>TJM freelance par spécialité</h2>
<ul>
  <li><strong>Architecte Cloud / Data</strong> : 700 – 900 €/j</li>
  <li><strong>ML Engineer / LLM</strong> : 650 – 850 €/j</li>
  <li><strong>DevOps / K8s</strong> : 600 – 800 €/j</li>
  <li><strong>Développeur Full-Stack</strong> : 450 – 650 €/j</li>
  <li><strong>Data Analyst</strong> : 350 – 500 €/j</li>
</ul>

<h2>Impact du full remote</h2>
<p>Les postes 100% remote paient en médiane 8% de moins que les postes sur site à Paris, mais permettent de recruter des profils seniors qui refuseraient de déménager. Avec le coût de la vie en province, un 100% remote à 60K€ équivaut souvent à 70K€ à Paris.</p>

<h2>Tendances 2026</h2>
<p>Les spécialistes IA/LLM voient leur rémunération augmenter de 15 à 25% par rapport à 2024. La cybersécurité reste en tension. Le développement web généraliste se stabilise avec la pression de l'outillage IA sur les tâches de bas niveau.</p>
    `,
    date: "20 mars 2026",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80",
    author: "Thomas R.",
    authorRole: "Data Scientist",
    tags: ["Salaires", "Marché", "TJM", "Freelance"],
  },
];

export const CATEGORIES = [
  { label: "Intelligence Artificielle", key: "INTELLIGENCE ARTIFICIELLE", color: "#8b5cf6" },
  { label: "Data Engineering", key: "DATA ENGINEERING", color: "#00b8d9" },
  { label: "MLOps", key: "MLOPS", color: "#10b981" },
  { label: "Cloud & Infrastructure", key: "CLOUD & INFRASTRUCTURE", color: "#f59e0b" },
  { label: "Data Science", key: "DATA SCIENCE", color: "#ef4444" },
  { label: "Marché", key: "MARCHÉ", color: "#10b981" },
];

export const ARTICLES_PER_PAGE = 6;
