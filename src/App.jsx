import React, { useState, useEffect, useCallback } from 'react';
import { Save, Library, Globe, Upload, BookOpen, X, Settings, User, Sparkles, Play, ChevronRight, Heart, Brain, Home, Users, Zap } from 'lucide-react';

// Import author styles from iOS app (25+ writing styles)
import { buildAuthorStylePrompt, getRandomAuthorForGenre } from './data/authorStyles.js';

// ============================================
// SECTION 1: CHARACTER GENERATION DATA
// Ported from seed_generator_v2.py
// ============================================

const ETHNICITIES = {
  "White American": {
    subgroups: ["Anglo", "Irish", "Italian", "German", "Polish", "Jewish", "Scandinavian"],
    typical_belonging: "insider",
    historical_trauma: null,
    code_switching: false
  },
  "Black American": {
    subgroups: ["Southern roots", "Northern migration", "Caribbean descent", "African immigrant"],
    typical_belonging: "outsider",
    historical_trauma: "slavery and its aftermath, Jim Crow, ongoing discrimination",
    code_switching: true
  },
  "Latino/Hispanic": {
    subgroups: ["Mexican", "Puerto Rican", "Cuban", "Central American", "South American"],
    typical_belonging: "conditional insider",
    historical_trauma: "colonization, forced migration, discrimination",
    code_switching: true
  },
  "Asian American": {
    subgroups: ["Chinese", "Japanese", "Korean", "Vietnamese", "Filipino", "Indian"],
    typical_belonging: "outsider",
    historical_trauma: "internment, exclusion acts, perpetual foreigner stereotype",
    code_switching: true
  },
  "Indigenous/Native American": {
    subgroups: ["Lakota", "Navajo", "Cherokee", "Ojibwe"],
    typical_belonging: "outsider",
    historical_trauma: "genocide, forced relocation, boarding schools",
    code_switching: true
  },
  "Mixed Race": {
    subgroups: ["various combinations"],
    typical_belonging: "conditional insider",
    historical_trauma: "varies by component identities",
    code_switching: true
  }
};

const CULTURAL_VALUES = {
  "Black American": { collectivism: 0.7, family_obligation: 0.8, respect_for_elders: 0.8, religious_role: "often central" },
  "Latino/Hispanic": { collectivism: 0.85, family_obligation: 0.9, respect_for_elders: 0.9, religious_role: "often central" },
  "Asian American": { collectivism: 0.8, family_obligation: 0.85, respect_for_elders: 0.9, religious_role: "varies" },
  "Indigenous/Native American": { collectivism: 0.9, family_obligation: 0.85, respect_for_elders: 0.95, religious_role: "spiritual/ceremonial" },
  "White American": { collectivism: 0.4, family_obligation: 0.5, respect_for_elders: 0.5, religious_role: "varies" },
  "Mixed Race": { collectivism: 0.6, family_obligation: 0.65, respect_for_elders: 0.7, religious_role: "varies" }
};

const COMMUNITY_INSTITUTIONS = {
  "Black American": ["Black church", "fraternal organizations", "HBCUs", "extended family network"],
  "Latino/Hispanic": ["Catholic church", "family network", "cultural associations", "quinceañera traditions"],
  "Asian American": ["ethnic associations", "temple/church", "family business networks", "cultural schools"],
  "Indigenous/Native American": ["tribal council", "ceremonies", "extended kinship", "reservation community"],
  "White American": ["mainstream institutions", "church", "civic organizations"],
  "Mixed Race": ["varies", "often navigating multiple communities"]
};

const ERAS = {
  // Medieval/Fantasy eras
  "1200s": { global: ["feudal societies", "crusades", "castle building", "early trade routes"] },
  "1400s": { global: ["Renaissance begins", "exploration age", "plague aftermath", "printing press"] },
  "1600s": { global: ["colonization", "scientific revolution", "religious wars", "absolute monarchies"] },
  // Historical eras
  "1800s": { global: ["Industrial Revolution", "colonialism peak", "Victorian era", "class struggles"] },
  "1860s": { global: ["American Civil War", "abolition movement", "frontier expansion", "reconstruction"] },
  "1880s": { global: ["Gilded Age", "railroad expansion", "immigration waves", "labor movements"] },
  "1900s": { global: ["Progressive Era", "immigration", "industrialization", "early automobiles"] },
  "1920s": { global: ["Roaring Twenties", "jazz age", "prohibition", "women's suffrage"] },
  "1930s": { global: ["Great Depression", "rise of fascism", "dust bowl", "New Deal"] },
  "1940s": { global: ["World War II", "Holocaust", "atomic age", "post-war rebuilding"] },
  "1950s": { global: ["Cold War", "post-war prosperity", "conformity culture", "early civil rights"] },
  "1960s": { global: ["civil rights movement", "Vietnam War", "counterculture", "assassinations"] },
  "1970s": { global: ["Vietnam ends", "Watergate", "oil crisis", "feminism"] },
  "1980s": { global: ["Reagan era", "AIDS crisis", "Cold War peak", "consumerism"] },
  "1990s": { global: ["Cold War ends", "tech boom", "globalization", "relative peace"] },
  "2000s": { global: ["9/11", "Iraq War", "social media rises", "2008 crash"] },
  "2010s": { global: ["recovery and inequality", "smartphone era", "political polarization", "climate awareness"] },
  // Future/Sci-Fi eras
  "2050s": { global: ["climate crisis peak", "AI revolution", "space colonization begins", "genetic engineering"] },
  "2100s": { global: ["interplanetary society", "post-scarcity economics", "human augmentation", "alien contact rumors"] },
  "2200s": { global: ["galactic expansion", "consciousness uploading", "terraforming projects", "post-human evolution"] }
};

const REGIONS = {
  "American South": { traits: ["segregation history", "religious influence", "honor culture"], class_mobility: 0.25, violence_normalized: 0.5 },
  "American Midwest": { traits: ["industrial/farming", "immigrant heritage", "community-focused"], class_mobility: 0.4, violence_normalized: 0.3 },
  "American Northeast": { traits: ["urban density", "cultural institutions", "class stratification"], class_mobility: 0.35, violence_normalized: 0.35 },
  "American West": { traits: ["frontier mythology", "individualism", "diverse geography"], class_mobility: 0.45, violence_normalized: 0.35 },
  "Urban Anywhere": { traits: ["diversity", "anonymity", "opportunity and danger"], class_mobility: 0.4, violence_normalized: 0.45 }
};

const PARENT_WOUNDS = [
  "abandoned by parent in childhood",
  "never good enough for their parents",
  "lost a sibling young",
  "survived war/violence",
  "emotional neglect, learned to self-rely",
  "parentified — raised their siblings",
  "escaped abusive marriage",
  "failed dreams, carries bitterness",
  "addiction in family of origin",
  "immigrant trauma, displacement",
  "witnessed domestic violence",
  "bullied severely, never recovered",
  null
];

const WOUND_COPING = {
  "abandoned by parent in childhood": ["clings, fears abandonment", "walls off, won't attach", "tests loyalty constantly"],
  "never good enough for their parents": ["perfectionist, critical of others", "gives up easily", "overachieves compulsively"],
  "emotional neglect, learned to self-rely": ["dismissive of emotions", "can't ask for help", "emotionally unavailable"],
  "parentified — raised their siblings": ["resents neediness", "compulsive caretaker", "exhausted, bitter"],
  "escaped abusive marriage": ["hypervigilant to control", "distrusts men/women", "overprotective"],
  "failed dreams, carries bitterness": ["lives through children", "sabotages others' success", "depressed, checked out"],
  "witnessed domestic violence": ["conflict avoidant", "recreates violence", "hypervigilant"],
  "bullied severely, never recovered": ["distrusts peers", "pushes child to be tough", "overidentifies with child's social struggles"]
};

const FAMILY_MYTHS = [
  "We are survivors — we always make it through",
  "Education is the only way out",
  "Don't trust anyone outside the family",
  "We don't talk about feelings",
  "Men provide, women sacrifice",
  "We came from nothing and built this",
  "Hard work solves everything",
  "Family comes first, always",
  "Trust no one completely"
];

const UNMOURNED_LOSSES = [
  "miscarriages no one discusses",
  "the homeland that was left behind",
  "the business that failed",
  "a child who died young",
  "dreams sacrificed for survival",
  null, null
];

const INVISIBLE_LOYALTIES = [
  "must succeed to justify grandparent's sacrifice",
  "must not surpass mother who gave up her dreams",
  "must carry the grief no one else will hold",
  "must prove the family's worth to the world",
  "must achieve what parent couldn't",
  null, null
];

const EMOTIONAL_CLIMATES = ["warm", "tense", "chaotic", "numb", "performative", "cold", "anxious"];

const UNSPOKEN_RULES = [
  "don't upset mother",
  "be invisible when father drinks",
  "always perform happiness",
  "never discuss family business outside",
  "your needs come last",
  "emotions are weakness",
  "loyalty above truth",
  "protect the family image",
  "never cry",
  "be grateful for what you have"
];

const SURVIVAL_REQUIREMENTS = [
  "be perfect", "be invisible", "be entertaining", "be the parent",
  "be the mediator", "be tough", "be useful", "be the star", "be the helper"
];

const GRANDPARENT_EXPERIENCES = [
  "survived the Great Depression",
  "lost everything in the crash",
  "dust bowl migration",
  "fought in World War II",
  "worked in war factories",
  "lost children to illness",
  "immigrant struggle",
  "civil rights activism",
  null
];

const BIRTH_CIRCUMSTANCES = [
  "difficult birth, oxygen deprivation",
  "premature, NICU stay",
  "twin who died",
  "mother nearly died",
  "unwanted pregnancy",
  "miracle baby after infertility",
  "born on significant date",
  null, null, null
];

// ============================================
// SECTION 2: CHARACTER GENERATOR CLASS
// ============================================

class CharacterGenerator {
  constructor() {
    this.idCounter = 0;
  }

  random(min = 0, max = 1) {
    return min + Math.random() * (max - min);
  }

  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  pickWeighted(options, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) return options[i];
    }
    return options[options.length - 1];
  }

  sample(array, n) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  weightedRandom(base, variance = 0.15) {
    return Math.max(0, Math.min(1, base + this.random(-variance, variance)));
  }

  generateId() {
    return `chr_${Date.now()}_${this.idCounter++}`;
  }

  generateWorldContext(era = null, region = null) {
    if (!era) era = this.pick(Object.keys(ERAS));
    if (!region) region = this.pick(Object.keys(REGIONS));

    const decadeStart = parseInt(era.slice(0, 4));
    const birthYear = decadeStart + this.randomInt(0, 9);

    let setting;
    if (region.includes("Urban")) setting = "urban";
    else if (region.includes("Rural")) setting = "rural";
    else setting = this.pick(["urban", "suburban", "rural"]);

    const regionData = REGIONS[region];
    const eraData = ERAS[era];

    return {
      era,
      birth_year: birthYear,
      region,
      setting,
      historical_context: eraData.global,
      class_mobility: regionData.class_mobility,
      violence_normalized: regionData.violence_normalized
    };
  }

  generateCulturalIdentity(world) {
    // Weight ethnicities
    const ethnicityWeights = {
      "White American": 0.50,
      "Black American": 0.15,
      "Latino/Hispanic": 0.18,
      "Asian American": 0.08,
      "Indigenous/Native American": 0.03,
      "Mixed Race": 0.06
    };

    const ethnicity = this.pickWeighted(
      Object.keys(ethnicityWeights),
      Object.values(ethnicityWeights)
    );

    const ethData = ETHNICITIES[ethnicity];
    const subgroup = ethData.subgroups[0] !== "various combinations" 
      ? this.pick(ethData.subgroups) 
      : null;

    // Immigration generation
    let immigration_generation;
    if (ethnicity === "Indigenous/Native American") {
      immigration_generation = "indigenous";
    } else if (ethnicity === "Black American") {
      immigration_generation = this.pickWeighted(
        ["enslaved descent", "2nd", "3rd+", "1st"],
        [0.7, 0.1, 0.15, 0.05]
      );
    } else {
      immigration_generation = this.pickWeighted(
        ["3rd+", "2nd", "1st"],
        [0.6, 0.25, 0.15]
      );
    }

    const values = CULTURAL_VALUES[ethnicity] || CULTURAL_VALUES["White American"];
    const institutions = COMMUNITY_INSTITUTIONS[ethnicity] || [];

    // Discrimination frequency based on belonging
    let discrimination_frequency;
    if (ethData.typical_belonging === "insider") {
      discrimination_frequency = "rare";
    } else if (ethData.typical_belonging === "conditional insider") {
      discrimination_frequency = this.pick(["occasional", "rare"]);
    } else {
      discrimination_frequency = this.pick(["frequent", "occasional"]);
    }

    return {
      ethnicity,
      subgroup,
      immigration_generation,
      language_home: ethnicity === "Latino/Hispanic" ? "Spanish" : "English",
      language_outside: "English",
      collectivism: this.weightedRandom(values.collectivism),
      family_obligation: this.weightedRandom(values.family_obligation),
      respect_for_elders: this.weightedRandom(values.respect_for_elders),
      religious_cultural_role: values.religious_role,
      belonging_status: ethData.typical_belonging,
      code_switching_required: ethData.code_switching,
      discrimination_frequency,
      historical_trauma: ethData.historical_trauma,
      community_institutions: this.sample(institutions, Math.min(3, institutions.length)),
      identity_relationship: this.pick(["proud", "conflicted", "exploring", "disconnected"])
    };
  }

  generateGrandparentEcho() {
    const exp = this.pick(GRANDPARENT_EXPERIENCES);
    if (!exp) return { defining_experience: null, what_it_taught: null, passed_down: null };

    return {
      defining_experience: exp,
      what_it_taught: "life is uncertain and hard",
      passed_down: this.pick(["anxiety about money", "emotional distance", "fierce protectiveness", "distrust of authority", "silence about the past", "survival mentality"])
    };
  }

  generateGenerationalEchoes() {
    return {
      maternal_grandmother: this.generateGrandparentEcho(),
      maternal_grandfather: this.generateGrandparentEcho(),
      paternal_grandmother: this.generateGrandparentEcho(),
      paternal_grandfather: this.generateGrandparentEcho(),
      family_myths: this.sample(FAMILY_MYTHS, this.randomInt(1, 3)),
      unmourned_losses: this.sample(UNMOURNED_LOSSES, 2).filter(x => x),
      invisible_loyalties: this.sample(INVISIBLE_LOYALTIES, 2).filter(x => x)
    };
  }

  generateParent(presentProbability = 0.9) {
    if (Math.random() > presentProbability) return null;

    const warmth = this.random();
    const stability = this.random();
    const wound = this.pick(PARENT_WOUNDS);
    
    let woundCoping = null;
    if (wound && WOUND_COPING[wound]) {
      woundCoping = this.pick(WOUND_COPING[wound]);
    }

    // Attention style based on warmth/stability
    let attention_style;
    if (warmth > 0.7 && stability > 0.6) {
      attention_style = this.pickWeighted(["attuned", "smothering", "inconsistent"], [0.7, 0.2, 0.1]);
    } else if (warmth < 0.3) {
      attention_style = this.pickWeighted(["neglectful", "inconsistent", "smothering"], [0.6, 0.3, 0.1]);
    } else {
      attention_style = this.pick(["attuned", "smothering", "neglectful", "inconsistent"]);
    }

    // What they provide/fail to provide
    const allProvisions = [
      "physical safety", "emotional attunement", "encouragement", "structure",
      "modeling healthy relationships", "validation of feelings", "protection", "unconditional love"
    ];
    const provisionCount = Math.floor((warmth + stability) * 4) + this.randomInt(0, 2);
    const provides = this.sample(allProvisions, Math.min(provisionCount, 5));
    const fails = allProvisions.filter(p => !provides.includes(p)).slice(0, this.randomInt(1, 3));

    return {
      present: true,
      warmth: Math.round(warmth * 100) / 100,
      stability: Math.round(stability * 100) / 100,
      openness: Math.round(this.random() * 100) / 100,
      dominance: Math.round(this.random() * 100) / 100,
      wound,
      wound_coping: woundCoping,
      attention_style,
      discipline_style: this.pick(["authoritative", "harsh", "permissive", "chaotic"]),
      substance_use: this.pickWeighted(["none", "social", "problematic", "addicted"], [0.5, 0.3, 0.15, 0.05]),
      mental_health: this.pickWeighted(["stable", "anxious", "depressed", "volatile"], [0.5, 0.25, 0.15, 0.1]),
      provides,
      fails_to_provide: fails
    };
  }

  generateSiblings() {
    const count = this.pickWeighted([0, 1, 2, 3], [0.2, 0.4, 0.25, 0.15]);
    const siblings = [];
    const roles = ["golden child", "scapegoat", "invisible", "caretaker", "mascot"];
    const usedRoles = new Set();

    for (let i = 0; i < count; i++) {
      let ageGap = this.randomInt(-8, 8);
      if (ageGap === 0) ageGap = this.pick([-1, 1]);

      const availableRoles = roles.filter(r => !usedRoles.has(r));
      const role = availableRoles.length > 0 ? this.pick([...availableRoles, "none"]) : "none";
      if (role !== "none") usedRoles.add(role);

      siblings.push({
        age_gap: ageGap,
        sex: this.pick(["M", "F"]),
        relationship_quality: this.pick(["protective", "competitive", "close", "distant", "hostile"]),
        favored: Math.random() < 0.2,
        role
      });
    }
    return siblings;
  }

  generateFamilyStructure(world) {
    const mother = this.generateParent(0.95);
    const father = this.generateParent(0.85);
    const siblings = this.generateSiblings();

    const socioeconomic = this.pickWeighted(
      ["wealthy", "comfortable", "working", "poor"],
      [0.1, 0.3, 0.4, 0.2]
    );

    let parental_relationship_quality = null;
    let what_child_witnesses = "nothing";
    
    if (mother && father) {
      const combinedStability = (mother.stability + father.stability) / 2;
      if (combinedStability > 0.6) {
        parental_relationship_quality = this.pickWeighted(["loving", "functional", "cold"], [0.5, 0.4, 0.1]);
      } else {
        parental_relationship_quality = this.pickWeighted(["volatile", "abusive", "cold", "functional"], [0.4, 0.2, 0.2, 0.2]);
      }

      // What child witnesses
      if (parental_relationship_quality === "loving") {
        what_child_witnesses = this.pick(["affection", "mild conflict"]);
      } else if (parental_relationship_quality === "volatile") {
        what_child_witnesses = this.pick(["conflict", "violence"]);
      } else if (parental_relationship_quality === "abusive") {
        what_child_witnesses = "violence";
      } else {
        what_child_witnesses = this.pick(["coldness", "nothing"]);
      }
    }

    // Household stability
    let stabilityBase = 0.5;
    if (mother) stabilityBase += (mother.stability - 0.5) * 0.3;
    if (father) stabilityBase += (father.stability - 0.5) * 0.3;
    if (parental_relationship_quality === "volatile" || parental_relationship_quality === "abusive") {
      stabilityBase -= 0.25;
    }

    return {
      mother,
      father,
      parental_relationship: mother && father ? "intact" : (mother ? "single_mother" : "single_father"),
      parental_relationship_quality,
      what_child_witnesses,
      siblings,
      socioeconomic,
      household_stability: Math.max(0.1, Math.min(0.95, stabilityBase)),
      religion: this.pick(["devout", "cultural", "absent"]),
      community_standing: this.pick(["respected", "average", "outsiders"]),
      extended_family_support: this.random()
    };
  }

  generateAtmosphericConditions(family) {
    // Emotional climate based on family dynamics
    let climate;
    if (family.parental_relationship_quality === "loving" && family.household_stability > 0.7) {
      climate = this.pickWeighted(["warm", "anxious", "performative"], [0.7, 0.15, 0.15]);
    } else if (family.parental_relationship_quality === "volatile") {
      climate = this.pickWeighted(["chaotic", "tense", "anxious"], [0.4, 0.4, 0.2]);
    } else if (family.parental_relationship_quality === "abusive") {
      climate = this.pickWeighted(["tense", "chaotic", "numb"], [0.5, 0.3, 0.2]);
    } else {
      climate = this.pick(EMOTIONAL_CLIMATES);
    }

    // Ambient threat
    let threat = 0.2;
    let threatSource = null;
    if (family.parental_relationship_quality === "volatile" || family.parental_relationship_quality === "abusive") {
      threat += 0.4;
      threatSource = "parental conflict/violence";
    }
    if (family.mother?.mental_health === "volatile") threat += 0.15;
    if (family.father?.mental_health === "volatile") threat += 0.15;
    if (family.mother?.substance_use === "addicted") threat += 0.1;
    if (family.father?.substance_use === "addicted") threat += 0.1;

    return {
      emotional_climate: climate,
      ambient_threat: Math.min(1, threat),
      threat_source: threatSource,
      predictability: family.household_stability,
      unspoken_rules: this.sample(UNSPOKEN_RULES, this.randomInt(2, 4)),
      attention_conditions: family.mother?.attention_style === "attuned" ? "unconditional" : 
                           family.mother?.attention_style === "neglectful" ? "crisis-only" : "performance-based",
      survival_requirements: this.sample(SURVIVAL_REQUIREMENTS, this.randomInt(1, 3))
    };
  }

  generateBiology() {
    const sex = this.pick(["M", "F"]);
    
    // Shadow traits (skewed low with occasional high)
    let callousness = this.random() * 0.5;
    if (Math.random() < 0.1) callousness = 0.5 + this.random() * 0.4;

    let paranoia = this.random() * 0.5;
    if (Math.random() < 0.1) paranoia = 0.5 + this.random() * 0.4;

    return {
      sex,
      // Temperament
      sensitivity: Math.round(this.random() * 100) / 100,
      baseline_energy: Math.round(this.random() * 100) / 100,
      novelty_seeking: Math.round(this.random() * 100) / 100,
      adaptability: Math.round(this.random() * 100) / 100,
      persistence: Math.round(this.random() * 100) / 100,
      initial_mood: Math.round(this.random() * 100) / 100,
      // Capacities
      empathy_potential: Math.round(this.random() * 100) / 100,
      impulse_control: Math.round(this.random() * 100) / 100,
      cognitive_baseline: Math.round(this.random() * 100) / 100,
      // Shadow
      callousness: Math.round(callousness * 100) / 100,
      dominance_drive: Math.round(this.random() * 100) / 100,
      sensation_seeking: Math.round(this.random() * 100) / 100,
      paranoia_tendency: Math.round(paranoia * 100) / 100,
      // Physical
      appearance_trajectory: this.pickWeighted(["plain", "average", "attractive", "striking"], [0.15, 0.55, 0.25, 0.05]),
      health_baseline: this.pickWeighted(["robust", "average", "fragile"], [0.25, 0.55, 0.2]),
      birth_circumstances: this.pick(BIRTH_CIRCUMSTANCES)
    };
  }

  generateEmbodiment(biology, atmospheric) {
    // Body relationship based on threat
    let bodyRelationship;
    if (atmospheric.ambient_threat > 0.6) {
      bodyRelationship = this.pickWeighted(["disconnected", "shameful", "hyperaware"], [0.4, 0.35, 0.25]);
    } else if (atmospheric.emotional_climate === "warm") {
      bodyRelationship = this.pickWeighted(["comfortable", "proud", "instrumental"], [0.5, 0.25, 0.25]);
    } else {
      bodyRelationship = this.pick(["comfortable", "disconnected", "instrumental", "shameful"]);
    }

    const bodySafety = Math.max(0.1, 1 - atmospheric.ambient_threat);
    const dissociation = Math.min(0.9, 0.2 + (atmospheric.ambient_threat > 0.6 ? 0.3 : 0) + (bodySafety < 0.4 ? 0.2 : 0));

    return {
      body_relationship: bodyRelationship,
      body_safety: Math.round(bodySafety * 100) / 100,
      stress_location: this.pick(["stomach", "chest", "throat", "shoulders", "headaches"]),
      chronic_tension: atmospheric.ambient_threat > 0.5 ? this.pick(["jaw", "shoulders", "back"]) : null,
      movement_quality: biology.baseline_energy > 0.7 ? this.pick(["athletic", "hyperactive"]) : this.pick(["graceful", "careful", "clumsy"]),
      body_confidence: Math.round((0.5 + (biology.appearance_trajectory === "attractive" ? 0.2 : 0) - (bodySafety < 0.5 ? 0.2 : 0)) * 100) / 100,
      dissociation_tendency: Math.round(dissociation * 100) / 100,
      triggers_leaving_body: atmospheric.ambient_threat > 0.5 ? ["conflict", "raised voices"] : ["extreme stress"]
    };
  }

  generateInternalWorkingModels(attachmentStyle) {
    if (attachmentStyle === "secure") {
      return {
        model_of_self: "worthy of love",
        model_of_other: "reliable",
        model_of_relationship: "safe haven",
        expects_from_others: ["support when needed", "reliability", "affection"],
        offers_in_relationships: ["trust", "vulnerability", "reciprocity"],
        repetition_compulsion: null
      };
    } else if (attachmentStyle === "anxious") {
      return {
        model_of_self: this.pick(["must earn love", "unlovable"]),
        model_of_other: "unpredictable",
        model_of_relationship: "source of anxiety",
        expects_from_others: ["abandonment", "inconsistency", "conditional love"],
        offers_in_relationships: ["excessive giving", "vigilance", "testing"],
        repetition_compulsion: "seeks emotionally unavailable partners"
      };
    } else if (attachmentStyle === "avoidant") {
      return {
        model_of_self: this.pick(["self-sufficient", "defective underneath"]),
        model_of_other: "will disappoint",
        model_of_relationship: "transactional",
        expects_from_others: ["disappointment", "demands", "engulfment"],
        offers_in_relationships: ["distance", "self-sufficiency", "limited access"],
        repetition_compulsion: "creates distance to confirm others will leave"
      };
    } else { // disorganized
      return {
        model_of_self: "defective",
        model_of_other: "dangerous",
        model_of_relationship: "source of pain",
        expects_from_others: ["harm", "unpredictability", "betrayal"],
        offers_in_relationships: ["chaos", "approach-avoid", "intensity"],
        repetition_compulsion: "recreates chaotic/abusive dynamics"
      };
    }
  }

  generateAttachment(family, biology, atmospheric) {
    // Determine primary caregiver
    let primaryCaregiver = "mother";
    if (!family.mother && family.father) primaryCaregiver = "father";
    else if (family.mother && family.father && family.father.warmth > family.mother.warmth) {
      primaryCaregiver = Math.random() < 0.5 ? "father" : "mother";
    }

    const caregiver = primaryCaregiver === "mother" ? family.mother : family.father;

    // Calculate care quality
    let consistency, responsiveness, attunement, warmth;
    if (caregiver) {
      if (caregiver.attention_style === "attuned") {
        consistency = this.weightedRandom(0.7);
        responsiveness = this.weightedRandom(0.75);
        attunement = this.weightedRandom(0.8);
      } else if (caregiver.attention_style === "neglectful") {
        consistency = this.weightedRandom(0.3);
        responsiveness = this.weightedRandom(0.25);
        attunement = this.weightedRandom(0.2);
      } else {
        consistency = this.weightedRandom(0.45);
        responsiveness = this.weightedRandom(0.5);
        attunement = this.weightedRandom(0.45);
      }
      warmth = caregiver.warmth;
    } else {
      consistency = this.weightedRandom(0.3);
      responsiveness = this.weightedRandom(0.2);
      attunement = this.weightedRandom(0.15);
      warmth = this.weightedRandom(0.25);
    }

    // Threat from caregiver
    const threat = family.parental_relationship_quality === "abusive" ||
      (caregiver?.mental_health === "volatile" && Math.random() < 0.4);

    // Calculate attachment style
    const careQuality = (consistency + responsiveness + attunement + warmth) / 4;
    let attachmentStyle;
    if (threat) {
      attachmentStyle = "disorganized";
    } else if (careQuality > 0.65 && consistency > 0.6) {
      attachmentStyle = "secure";
    } else if (consistency < 0.5 && warmth > 0.4) {
      attachmentStyle = "anxious";
    } else if (warmth < 0.4 && consistency > 0.5) {
      attachmentStyle = "avoidant";
    } else {
      attachmentStyle = this.pickWeighted(["secure", "anxious", "avoidant"], [0.4, 0.35, 0.25]);
    }

    // Core beliefs based on attachment
    let coreBeliefs;
    if (attachmentStyle === "secure") {
      coreBeliefs = {
        "I am worthy of love": 0.6 + this.random() * 0.3,
        "Others can be trusted": 0.6 + this.random() * 0.3,
        "The world is safe": 0.5 + this.random() * 0.3,
        "My needs matter": 0.6 + this.random() * 0.3,
        "I can affect outcomes": 0.5 + this.random() * 0.3
      };
    } else if (attachmentStyle === "anxious") {
      coreBeliefs = {
        "I am worthy of love": 0.3 + this.random() * 0.3,
        "Others can be trusted": 0.4 + this.random() * 0.3,
        "The world is safe": 0.3 + this.random() * 0.3,
        "My needs matter": 0.3 + this.random() * 0.3,
        "I can affect outcomes": 0.3 + this.random() * 0.3
      };
    } else if (attachmentStyle === "avoidant") {
      coreBeliefs = {
        "I am worthy of love": 0.4 + this.random() * 0.3,
        "Others can be trusted": 0.2 + this.random() * 0.3,
        "The world is safe": 0.4 + this.random() * 0.3,
        "My needs matter": 0.3 + this.random() * 0.3,
        "I can affect outcomes": 0.5 + this.random() * 0.3
      };
    } else { // disorganized
      coreBeliefs = {
        "I am worthy of love": 0.1 + this.random() * 0.3,
        "Others can be trusted": 0.1 + this.random() * 0.3,
        "The world is safe": 0.1 + this.random() * 0.2,
        "My needs matter": 0.1 + this.random() * 0.3,
        "I can affect outcomes": 0.2 + this.random() * 0.3
      };
    }

    // Round all beliefs
    Object.keys(coreBeliefs).forEach(k => {
      coreBeliefs[k] = Math.round(coreBeliefs[k] * 100) / 100;
    });

    return {
      primary_caregiver: primaryCaregiver,
      consistency: Math.round(consistency * 100) / 100,
      responsiveness: Math.round(responsiveness * 100) / 100,
      attunement: Math.round(attunement * 100) / 100,
      warmth: Math.round(warmth * 100) / 100,
      threat_from_caregiver: threat,
      attachment_style: attachmentStyle,
      core_beliefs: coreBeliefs,
      internal_working_models: this.generateInternalWorkingModels(attachmentStyle)
    };
  }

  generateSeed(era = null, region = null) {
    const options = { era, region };
    return this.generate(options);
  }

  generate(options = {}) {
    const world = this.generateWorldContext(options.era, options.region);
    const cultural = this.generateCulturalIdentity(world);
    const generational = this.generateGenerationalEchoes();
    const family = this.generateFamilyStructure(world);
    const atmospheric = this.generateAtmosphericConditions(family);
    const biology = this.generateBiology();
    const embodiment = this.generateEmbodiment(biology, atmospheric);
    const attachment = this.generateAttachment(family, biology, atmospheric);

    return {
      id: this.generateId(),
      name: null, // User can name later
      world,
      cultural_identity: cultural,
      generational_echoes: generational,
      family,
      atmospheric_conditions: atmospheric,
      biology,
      embodiment,
      attachment,
      created_at: new Date().toISOString(),
      simulated: false, // Has childhood been simulated?
      simulation_results: null
    };
  }
}

// ============================================
// SECTION 3: EVENT SIMULATION ENGINE
// Ported from event_generator.py
// ============================================

const EVENT_TEMPLATES = {
  family: {
    positive: ["parent_praise", "parent_teaches", "defended_by_parent", "family_celebration"],
    negative: ["parent_criticism", "parent_absent", "parental_conflict", "favoritism_shown", "broken_promise"],
    traumatic: ["physical_abuse", "emotional_abuse", "neglect_episode", "witnessed_violence"]
  },
  peer: {
    positive: ["friendship_formed", "defended_by_peer", "group_acceptance", "first_crush"],
    negative: ["betrayal", "exclusion", "bullied", "romantic_rejection", "humiliated_publicly"]
  },
  world: {
    positive: ["positive_teacher", "institutional_success", "mentor_encounter"],
    negative: ["negative_teacher", "institutional_failure", "witnessed_injustice", "discrimination_experienced"]
  },
  body: {
    neutral: ["illness", "injury", "puberty_onset", "appearance_change", "discovered_talent", "discovered_limitation"]
  },
  absence: {
    all: ["celebration_missing", "protection_missing", "teaching_missing", "presence_missing", "comfort_missing"]
  }
};

const DOMAIN_WEIGHTS_BY_AGE = {
  early: { family: 0.75, peer: 0.05, body: 0.15, random: 0.05 }, // 0-5
  middle: { family: 0.40, peer: 0.30, world: 0.15, body: 0.10, random: 0.05 }, // 6-11
  adolescent: { family: 0.25, peer: 0.35, world: 0.20, body: 0.15, random: 0.05 } // 12-18
};

const EVENTS_PER_YEAR = {
  early: 4,    // 0-5
  middle: 6,   // 6-11
  adolescent: 8 // 12-18
};

class EventSimulator {
  constructor(character) {
    this.character = character;
    this.currentBeliefs = { ...character.attachment.core_beliefs };
    this.traits = {
      openness: 0.5, conscientiousness: 0.5, extraversion: 0.5,
      agreeableness: 0.5, neuroticism: 0.5
    };
    this.copingPatterns = [];
    this.coreMemories = [];
    this.eventLog = [];
    this.eventCount = 0;
    this.eventsOccurred = new Set();
  }

  random(min = 0, max = 1) {
    return min + Math.random() * (max - min);
  }

  pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  pickWeighted(options, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) return options[i];
    }
    return options[options.length - 1];
  }

  getAgePhase(age) {
    if (age <= 5) return "early";
    if (age <= 11) return "middle";
    return "adolescent";
  }

  getDomainWeights(age) {
    return DOMAIN_WEIGHTS_BY_AGE[this.getAgePhase(age)];
  }

  selectDomain(age) {
    const weights = this.getDomainWeights(age);
    return this.pickWeighted(Object.keys(weights), Object.values(weights));
  }

  selectEventType(domain, age) {
    const templates = EVENT_TEMPLATES[domain];
    if (!templates) return "generic_event";

    // Weight positive vs negative based on atmospheric threat
    const threat = this.character.atmospheric_conditions.ambient_threat;
    const positiveWeight = 1 - threat * 0.5;
    const negativeWeight = 0.5 + threat * 0.3;

    const categories = Object.keys(templates);
    if (categories.includes("positive") && categories.includes("negative")) {
      const category = this.pickWeighted(
        ["positive", "negative", "traumatic"].filter(c => templates[c]),
        [positiveWeight, negativeWeight, threat * 0.3]
      );
      return this.pick(templates[category] || templates.positive);
    }
    
    const allEvents = Object.values(templates).flat();
    return this.pick(allEvents);
  }

  generateEvent(age) {
    const domain = this.selectDomain(age);
    const eventType = this.selectEventType(domain, age);
    
    // Calculate severity (threat modulates)
    const threat = this.character.atmospheric_conditions.ambient_threat;
    const isPositive = EVENT_TEMPLATES[domain]?.positive?.includes(eventType);
    let severity;
    if (isPositive) {
      severity = 0.3 + this.random() * 0.5;
    } else {
      severity = (0.3 + this.random() * 0.6) * (0.5 + threat * 0.5);
    }

    // Is this a developmental window?
    const inWindow = (age <= 3 && domain === "family") ||
                     (age >= 6 && age <= 11 && domain === "peer") ||
                     (age >= 12 && domain === "world");
    const multiplier = inWindow ? 2.0 : 1.0;

    const isFirst = !this.eventsOccurred.has(eventType);
    if (isFirst) this.eventsOccurred.add(eventType);

    this.eventCount++;

    return {
      id: `evt_${this.eventCount}`,
      age: Math.round(age * 10) / 10,
      domain,
      event_type: eventType,
      severity: Math.round(severity * 100) / 100,
      is_positive: isPositive,
      is_first: isFirst,
      developmental_window: inWindow,
      window_multiplier: multiplier
    };
  }

  interpretEvent(event) {
    const positiveEmotions = ["joy", "pride", "relief", "connection", "love"];
    const negativeEmotions = ["fear", "anger", "shame", "sadness"];
    
    // Primary emotion
    let primaryEmotion, intensity;
    if (event.is_positive) {
      primaryEmotion = this.pick(positiveEmotions);
      intensity = 0.5 + event.severity * 0.3;
    } else {
      primaryEmotion = this.pick(negativeEmotions);
      intensity = 0.5 + event.severity * 0.4;
    }

    // Modify by temperament and attachment
    const sensitivity = this.character.biology.sensitivity;
    intensity *= (0.7 + sensitivity * 0.6);
    
    if (this.character.attachment.attachment_style === "anxious") {
      if (["fear", "shame"].includes(primaryEmotion)) intensity *= 1.3;
    } else if (this.character.attachment.attachment_style === "avoidant") {
      intensity *= 0.7;
    } else if (this.character.attachment.attachment_style === "disorganized") {
      if (["fear", "anger"].includes(primaryEmotion)) intensity *= 1.4;
    }
    intensity = Math.min(1, intensity);

    // Attribution
    const selfWorth = this.currentBeliefs["I am worthy of love"];
    let attribution;
    if (event.is_positive) {
      attribution = selfWorth > 0.5 ? "my doing" : this.pick(["their kindness", "good luck"]);
    } else {
      if (selfWorth < 0.4 && Math.random() < 0.6) {
        attribution = "my fault";
      } else {
        attribution = this.pick(["my fault", "their fault", "no one's fault", "life's fault"]);
      }
    }

    // Meaning making
    let aboutSelf, aboutOthers, aboutWorld;
    if (event.is_positive) {
      aboutSelf = selfWorth > 0.4 ? 
        this.pick(["I can do this", "Maybe I'm okay"]) :
        this.pick(["Maybe I'm okay", "I got lucky"]);
      aboutOthers = this.pick(["Some people are good", "Connection is possible"]);
      aboutWorld = this.pick(["Good things can happen", "Maybe things will be okay"]);
    } else {
      aboutSelf = attribution === "my fault" && event.severity > 0.7 ?
        this.pick(["I am bad", "I am not enough", "I cause problems"]) :
        this.pick(["I made a mistake", "I survived this"]);
      aboutOthers = event.severity > 0.7 ?
        this.pick(["People hurt you", "Trust is dangerous"]) :
        this.pick(["People are unpredictable", "Be careful"]);
      aboutWorld = event.severity > 0.8 ?
        this.pick(["The world is dangerous", "Bad things happen"]) :
        this.pick(["The world is complicated", "Life goes on"]);
    }

    // Behavioral response
    const dominance = this.character.biology.dominance_drive;
    let behavioralResponse;
    if (this.character.attachment.attachment_style === "disorganized") {
      behavioralResponse = this.pick(["freeze", "fight", "fawn"]);
    } else if (event.severity > 0.7) {
      behavioralResponse = dominance > 0.6 ?
        this.pickWeighted(["fight", "flight"], [0.7, 0.3]) :
        this.pick(["freeze", "fawn"]);
    } else {
      behavioralResponse = this.pick(["flight", "fawn"]);
    }

    // Salience
    let salience = intensity * 0.3 + (event.is_first ? 0.15 : 0) + event.severity * 0.15;
    if (event.developmental_window) salience += 0.1;
    salience = Math.min(1, salience);

    return {
      event_id: event.id,
      primary_emotion: primaryEmotion,
      emotion_intensity: Math.round(intensity * 100) / 100,
      attribution,
      about_self: aboutSelf,
      about_others: aboutOthers,
      about_world: aboutWorld,
      behavioral_response: behavioralResponse,
      salience: Math.round(salience * 100) / 100,
      is_core_memory: salience > 0.65
    };
  }

  updateState(event, interpretation) {
    const magnitude = (0.01 + event.severity * 0.04) * event.window_multiplier * (event.is_first ? 1.5 : 1);
    const isPositive = event.is_positive;
    const boost = isPositive ? 1.2 : 1.0;

    // Belief updates
    const negSelfMeanings = ["I am bad", "I am not enough", "I cause problems"];
    const posSelfMeanings = ["I can do this", "Maybe I'm okay"];
    const negOtherMeanings = ["People hurt you", "Trust is dangerous"];
    const posOtherMeanings = ["Some people are good", "Connection is possible"];
    const negWorldMeanings = ["The world is dangerous", "Bad things happen"];
    const posWorldMeanings = ["Good things can happen", "Maybe things will be okay"];

    if (negSelfMeanings.includes(interpretation.about_self)) {
      this.currentBeliefs["I am worthy of love"] = Math.max(0.05, this.currentBeliefs["I am worthy of love"] - magnitude);
    } else if (posSelfMeanings.includes(interpretation.about_self)) {
      this.currentBeliefs["I am worthy of love"] = Math.min(0.95, this.currentBeliefs["I am worthy of love"] + magnitude * boost);
      this.currentBeliefs["My needs matter"] = Math.min(0.95, this.currentBeliefs["My needs matter"] + magnitude * 0.5);
    }

    if (negOtherMeanings.includes(interpretation.about_others)) {
      this.currentBeliefs["Others can be trusted"] = Math.max(0.05, this.currentBeliefs["Others can be trusted"] - magnitude);
    } else if (posOtherMeanings.includes(interpretation.about_others)) {
      this.currentBeliefs["Others can be trusted"] = Math.min(0.95, this.currentBeliefs["Others can be trusted"] + magnitude * boost);
    }

    if (negWorldMeanings.includes(interpretation.about_world)) {
      this.currentBeliefs["The world is safe"] = Math.max(0.05, this.currentBeliefs["The world is safe"] - magnitude);
    } else if (posWorldMeanings.includes(interpretation.about_world)) {
      this.currentBeliefs["The world is safe"] = Math.min(0.95, this.currentBeliefs["The world is safe"] + magnitude * boost);
    }

    // Agency updates
    if (interpretation.attribution === "my doing") {
      this.currentBeliefs["I can affect outcomes"] = Math.min(0.95, this.currentBeliefs["I can affect outcomes"] + magnitude);
    } else if (interpretation.attribution === "my fault" && !isPositive) {
      this.currentBeliefs["I can affect outcomes"] = Math.min(0.95, this.currentBeliefs["I can affect outcomes"] + magnitude * 0.3);
    }

    // Trait updates
    if (["fear", "anxiety"].includes(interpretation.primary_emotion)) {
      this.traits.neuroticism = Math.min(0.9, this.traits.neuroticism + magnitude);
      this.traits.extraversion = Math.max(0.1, this.traits.extraversion - magnitude * 0.5);
    } else if (["joy", "pride"].includes(interpretation.primary_emotion)) {
      this.traits.neuroticism = Math.max(0.1, this.traits.neuroticism - magnitude * 0.3);
      this.traits.extraversion = Math.min(0.9, this.traits.extraversion + magnitude * 0.5);
    }

    if (interpretation.behavioral_response === "fight") {
      this.traits.agreeableness = Math.max(0.1, this.traits.agreeableness - magnitude * 0.3);
    } else if (interpretation.behavioral_response === "fawn") {
      this.traits.agreeableness = Math.min(0.9, this.traits.agreeableness + magnitude * 0.3);
    }

    // Add coping pattern
    if (event.severity > 0.7 && Math.random() < 0.3) {
      const coping = this.pick(["denial", "distraction", "seeking support", "withdrawal", "fantasy", "humor", "aggression", "self-blame"]);
      if (!this.copingPatterns.includes(coping)) {
        this.copingPatterns.push(coping);
      }
    }

    // Round beliefs
    Object.keys(this.currentBeliefs).forEach(k => {
      this.currentBeliefs[k] = Math.round(this.currentBeliefs[k] * 100) / 100;
    });
    Object.keys(this.traits).forEach(k => {
      this.traits[k] = Math.round(this.traits[k] * 100) / 100;
    });
  }

  simulateChildhood(startAge = 0, endAge = 18, onEvent = null) {
    const allEvents = [];

    for (let age = startAge; age <= endAge; age++) {
      const phase = this.getAgePhase(age);
      const eventsThisYear = EVENTS_PER_YEAR[phase] + Math.floor(Math.random() * 3) - 1;

      for (let i = 0; i < Math.max(1, eventsThisYear); i++) {
        const eventAge = age + (i / eventsThisYear);
        const event = this.generateEvent(eventAge);
        const interpretation = this.interpretEvent(event);
        this.updateState(event, interpretation);

        const record = {
          event,
          interpretation,
          beliefs_after: { ...this.currentBeliefs },
          traits_after: { ...this.traits }
        };

        allEvents.push(record);

        if (interpretation.is_core_memory) {
          this.coreMemories.push({
            age: event.age,
            type: event.event_type,
            emotion: interpretation.primary_emotion,
            meaning: interpretation.about_self
          });
        }

        if (onEvent) onEvent(record);
      }
    }

    return {
      events: allEvents,
      final_beliefs: this.currentBeliefs,
      final_traits: this.traits,
      coping_patterns: this.copingPatterns,
      core_memories: this.coreMemories,
      total_events: allEvents.length
    };
  }
}

// ============================================
// SECTION 4: STORAGE MANAGER
// ============================================

class StorageManager {
  constructor() {
    this.prefix = 'loomiverse_';
  }

  // API Keys
  saveApiKey(provider, key) {
    localStorage.setItem(this.prefix + 'apikey_' + provider, key);
  }
  
  getApiKey(provider) {
    return localStorage.getItem(this.prefix + 'apikey_' + provider) || '';
  }

  // Stories
  saveStory(id, data) {
    localStorage.setItem(this.prefix + 'story_' + id, JSON.stringify(data));
  }
  
  loadStory(id) {
    const d = localStorage.getItem(this.prefix + 'story_' + id);
    return d ? JSON.parse(d) : null;
  }
  
  listStories() {
    const stories = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix + 'story_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          stories.push({
            id: key.replace(this.prefix + 'story_', ''),
            title: data.bible?.title || 'Untitled',
            genre: data.bible?.genre || 'Unknown',
            logline: data.bible?.logline || '',
            lastPlayed: data.lastPlayed || new Date().toISOString(),
            progress: data.bible?.currentChapter || 0,
            totalChapters: data.bible?.totalChapters || 10,
            coverGradient: data.coverGradient || null,
            protagonistName: data.bible?.protagonist?.name || null
          });
        } catch (e) { /* skip invalid */ }
      }
    }
    return stories.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
  }
  
  deleteStory(id) {
    localStorage.removeItem(this.prefix + 'story_' + id);
  }

  // Characters - Enhanced with origin tracking
  saveCharacter(char, origin = 'user', storyId = null, storyTitle = null) {
    const chars = this.getCharacters();
    const idx = chars.findIndex(c => c.id === char.id);
    
    // Add origin metadata if not present
    const charWithMeta = {
      ...char,
      origin: char.origin || origin,
      originStoryId: char.originStoryId || storyId,
      originStoryTitle: char.originStoryTitle || storyTitle,
      savedAt: char.savedAt || new Date().toISOString()
    };
    
    if (idx >= 0) chars[idx] = charWithMeta;
    else chars.push(charWithMeta);
    localStorage.setItem(this.prefix + 'characters', JSON.stringify(chars));
  }
  
  getCharacters(filter = 'all') {
    const d = localStorage.getItem(this.prefix + 'characters');
    let chars = d ? JSON.parse(d) : [];
    
    // Apply filter
    if (filter === 'user') {
      chars = chars.filter(c => c.origin === 'user');
    } else if (filter === 'story') {
      chars = chars.filter(c => c.origin === 'story');
    }
    
    return chars;
  }

  deleteCharacter(id) {
    const chars = this.getCharacters().filter(c => c.id !== id);
    localStorage.setItem(this.prefix + 'characters', JSON.stringify(chars));
  }

  // Settings
  saveSetting(key, value) {
    localStorage.setItem(this.prefix + 'setting_' + key, JSON.stringify(value));
  }

  getSetting(key, defaultValue = null) {
    const d = localStorage.getItem(this.prefix + 'setting_' + key);
    return d ? JSON.parse(d) : defaultValue;
  }

  // ============================================
  // USER PROFILE & STATS
  // ============================================

  getDefaultProfile() {
    return {
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      displayName: 'Storyteller',
      stats: {
        storiesCreated: 0,
        storiesCompleted: 0,
        chaptersRead: 0,
        charactersGenerated: 0,
        totalReadingTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null
      },
      genreUsage: {},
      achievements: [],
      preferences: {
        favoriteGenres: [],
        preferredReadingLength: 'medium',
        darkMode: true
      }
    };
  }

  saveUserProfile(profile) {
    localStorage.setItem(this.prefix + 'user_profile', JSON.stringify(profile));
  }

  getUserProfile() {
    const d = localStorage.getItem(this.prefix + 'user_profile');
    return d ? JSON.parse(d) : this.getDefaultProfile();
  }

  updateStat(statKey, value, operation = 'set') {
    const profile = this.getUserProfile();
    if (operation === 'increment') {
      profile.stats[statKey] = (profile.stats[statKey] || 0) + value;
    } else if (operation === 'set') {
      profile.stats[statKey] = value;
    }
    profile.lastActive = new Date().toISOString();
    this.saveUserProfile(profile);
    return profile;
  }

  trackGenreUsage(genre) {
    const profile = this.getUserProfile();
    profile.genreUsage[genre] = (profile.genreUsage[genre] || 0) + 1;
    this.saveUserProfile(profile);
  }

  updateReadingStreak() {
    const profile = this.getUserProfile();
    const today = new Date().toDateString();
    const lastRead = profile.stats.lastReadDate;

    if (!lastRead) {
      profile.stats.currentStreak = 1;
    } else {
      const lastDate = new Date(lastRead);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        profile.stats.currentStreak += 1;
      } else if (lastDate.toDateString() !== today) {
        profile.stats.currentStreak = 1;
      }
    }

    profile.stats.lastReadDate = today;
    profile.stats.longestStreak = Math.max(
      profile.stats.longestStreak,
      profile.stats.currentStreak
    );
    this.saveUserProfile(profile);
    return profile;
  }

  getFavoriteGenres() {
    const profile = this.getUserProfile();
    return Object.entries(profile.genreUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
  }

  unlockAchievement(achievementId) {
    const profile = this.getUserProfile();
    if (!profile.achievements.includes(achievementId)) {
      profile.achievements.push(achievementId);
      this.saveUserProfile(profile);
      return true;
    }
    return false;
  }

  checkAchievements() {
    const profile = this.getUserProfile();
    const newAchievements = [];

    const achievementConditions = {
      'first_story': profile.stats.storiesCreated >= 1,
      'storyteller': profile.stats.storiesCreated >= 5,
      'prolific_author': profile.stats.storiesCreated >= 10,
      'first_completion': profile.stats.storiesCompleted >= 1,
      'finisher': profile.stats.storiesCompleted >= 5,
      'character_creator': profile.stats.charactersGenerated >= 1,
      'character_master': profile.stats.charactersGenerated >= 10,
      'bookworm': profile.stats.chaptersRead >= 50,
      'dedicated_reader': profile.stats.chaptersRead >= 100,
      'streak_starter': profile.stats.currentStreak >= 3,
      'streak_keeper': profile.stats.currentStreak >= 7,
      'genre_explorer': Object.keys(profile.genreUsage).length >= 5
    };

    for (const [id, condition] of Object.entries(achievementConditions)) {
      if (condition && this.unlockAchievement(id)) {
        newAchievements.push(id);
      }
    }

    return newAchievements;
  }
}

// ============================================
// SECTION 5: STORY BIBLE CLASS
// ============================================

const NarrativePhase = {
  SETUP: 'setup',
  INCITING: 'inciting_incident',
  RISING: 'rising_action',
  MIDPOINT: 'midpoint',
  ESCALATION: 'escalation',
  CRISIS: 'crisis',
  CLIMAX: 'climax',
  RESOLUTION: 'resolution'
};

const PhaseGuidance = {
  [NarrativePhase.SETUP]: 'Establish the ordinary world. Introduce protagonist and their desires.',
  [NarrativePhase.INCITING]: 'Something disrupts the ordinary world. Point of no return.',
  [NarrativePhase.RISING]: 'Escalating challenges. Introduce allies and enemies.',
  [NarrativePhase.MIDPOINT]: 'Major revelation or shift. Stakes become personal.',
  [NarrativePhase.ESCALATION]: 'Consequences intensify. Relationships tested.',
  [NarrativePhase.CRISIS]: 'All seems lost. Darkest moment. Critical decision.',
  [NarrativePhase.CLIMAX]: 'Final confrontation. Resolve central conflict.',
  [NarrativePhase.RESOLUTION]: 'New equilibrium. Tie up threads. Show change.'
};

class StoryBible {
  constructor(title, genre, logline, tone = 'dramatic') {
    this.title = title;
    this.genre = genre;
    this.logline = logline;
    this.tone = tone;
    this.currentChapter = 0;
    this.totalChapters = 10;
    this.characters = {};
    this.worldFacts = [];
    this.chapterSummaries = [];
    this.pendingContinuity = [];
    this.choiceHistory = [];
    this.storyId = Date.now().toString();
    this.protagonistProfile = null; // Emergent character integration

    // NEW: Author style and story outline (ported from iOS app)
    this.authorStyle = null; // { name, description } from AuthorStyles.json
    this.storyOutline = []; // Array of plot points for narrative guidance
    this.genreFormula = []; // Genre-specific story beats
  }

  // Set the author style for this story
  setAuthorStyle(author) {
    this.authorStyle = author;
  }

  // Set the story outline (generated before chapter 1)
  setStoryOutline(outline) {
    this.storyOutline = outline;
  }

  // Set genre-specific formula
  setGenreFormula(formula) {
    this.genreFormula = formula;
  }

  // Get current plot point based on chapter number
  getCurrentPlotPoint() {
    if (this.storyOutline.length === 0) return null;
    const index = Math.min(this.currentChapter - 1, this.storyOutline.length - 1);
    return this.storyOutline[index] || null;
  }

  // Format the story outline for AI context
  formatOutlineContext() {
    if (this.storyOutline.length === 0) return '';

    let context = '\n═══════════════════════════════════════════════════\n';
    context += 'STORY OUTLINE (Use as narrative guide)\n';
    context += '═══════════════════════════════════════════════════\n';

    this.storyOutline.forEach((point, i) => {
      const marker = i + 1 === this.currentChapter ? '→ ' : '  ';
      const status = i + 1 < this.currentChapter ? '✓' : i + 1 === this.currentChapter ? '●' : '○';
      context += `${marker}${status} ${i + 1}. ${point}\n`;
    });

    return context;
  }

  // Format author style for AI context
  formatAuthorStyleContext() {
    if (!this.authorStyle) return '';

    let context = '\n═══════════════════════════════════════════════════\n';
    context += 'WRITING STYLE GUIDANCE\n';
    context += '═══════════════════════════════════════════════════\n';
    context += `Author Inspiration: ${this.authorStyle.name}\n`;
    if (this.authorStyle.description) {
      context += `\n${this.authorStyle.description}\n`;
    }

    return context;
  }

  setProtagonist(characterProfile) {
    this.protagonistProfile = characterProfile;
    // Add protagonist to characters
    this.addCharacter(
      characterProfile.name || 'Protagonist',
      'Protagonist',
      this.extractTraits(characterProfile),
      {}
    );
  }

  extractTraits(profile) {
    const traits = [];
    if (profile.attachment?.attachment_style) {
      traits.push(`${profile.attachment.attachment_style} attachment`);
    }
    if (profile.biology?.sensitivity > 0.7) traits.push('highly sensitive');
    if (profile.biology?.dominance_drive > 0.7) traits.push('dominant');
    if (profile.biology?.empathy_potential > 0.7) traits.push('deeply empathic');
    if (profile.atmospheric_conditions?.ambient_threat > 0.6) traits.push('hypervigilant');
    return traits;
  }

  calculatePhase(chapterNumber) {
    const progress = chapterNumber / this.totalChapters;
    if (progress <= 0.15) return NarrativePhase.SETUP;
    if (progress <= 0.25) return NarrativePhase.INCITING;
    if (progress <= 0.45) return NarrativePhase.RISING;
    if (progress <= 0.55) return NarrativePhase.MIDPOINT;
    if (progress <= 0.70) return NarrativePhase.ESCALATION;
    if (progress <= 0.85) return NarrativePhase.CRISIS;
    if (progress <= 0.95) return NarrativePhase.CLIMAX;
    return NarrativePhase.RESOLUTION;
  }

  getRollingSummary(lastN = 3) {
    const recent = this.chapterSummaries.slice(-lastN);
    if (recent.length === 0) return 'No chapters written yet. This is the beginning of the story.';
    return recent.map(ch => `Chapter ${ch.number} (${ch.title}): ${ch.summary}`).join('\n\n');
  }

  getActiveCharacters() {
    return Object.values(this.characters).filter(c => c.status === 'active');
  }

  formatProtagonistPsychology() {
    if (!this.protagonistProfile) return '';
    
    const p = this.protagonistProfile;
    const iwm = p.attachment?.internal_working_models;
    const beliefs = p.attachment?.core_beliefs;
    const memories = p.simulation_results?.core_memories?.slice(0, 3) || [];
    
    let psych = `\n═══════════════════════════════════════════════════
PROTAGONIST PSYCHOLOGY (Use to inform behavior/reactions)
═══════════════════════════════════════════════════\n`;
    
    psych += `Attachment Style: ${p.attachment?.attachment_style?.toUpperCase()}\n`;
    
    if (iwm) {
      psych += `\nInternal Working Models:
- Self-view: "${iwm.model_of_self}"
- View of others: "${iwm.model_of_other}"
- Relationships are: "${iwm.model_of_relationship}"\n`;
    }
    
    if (beliefs) {
      psych += `\nCore Beliefs:\n`;
      Object.entries(beliefs).forEach(([belief, value]) => {
        const strength = value > 0.6 ? 'Strong' : value > 0.4 ? 'Moderate' : 'Weak';
        psych += `- ${belief}: ${strength} (${Math.round(value * 100)}%)\n`;
      });
    }
    
    if (memories.length > 0) {
      psych += `\nFormative Memories (may surface in story):`;
      memories.forEach(m => {
        psych += `\n- Age ${m.age}: ${m.type} → felt "${m.meaning}"`;
      });
    }
    
    if (p.simulation_results?.coping_patterns?.length > 0) {
      psych += `\n\nCoping Patterns: ${p.simulation_results.coping_patterns.join(', ')}`;
    }
    
    return psych;
  }

  formatCharactersForContext() {
    const chars = this.getActiveCharacters();
    if (chars.length === 0) return 'No characters established yet.';
    return chars.map(c => {
      const rels = Object.entries(c.relationships || {}).map(([name, rel]) => `${name} (${rel})`).join(', ');
      return `CHARACTER: ${c.name}\n- Role: ${c.role}\n- Traits: ${(c.traits || []).join(', ')}\n- Relationships: ${rels || 'None established'}`;
    }).join('\n\n');
  }

  formatWorldFactsForContext() {
    const critical = this.worldFacts.filter(f => f.importance === 'critical');
    if (critical.length === 0) return 'No critical world rules established yet.';
    return critical.map(f => `• [${f.category.toUpperCase()}] ${f.fact}`).join('\n');
  }

  formatChoiceHistory() {
    if (this.choiceHistory.length === 0) return 'No previous choices.';
    return this.choiceHistory.slice(-5).map(c => `• Chapter ${c.chapter}: ${c.description}`).join('\n');
  }

  buildContextInjection(chapterNumber) {
    const phase = this.calculatePhase(chapterNumber);
    const guidance = PhaseGuidance[phase];
    const currentPlotPoint = this.getCurrentPlotPoint();

    let context = `
═══════════════════════════════════════════════════════════════════════════════
STORY BIBLE - CONTINUITY CONTEXT (CRITICAL: DO NOT IGNORE)
═══════════════════════════════════════════════════════════════════════════════

STORY: ${this.title}
GENRE: ${this.genre}
TONE: ${this.tone}
LOGLINE: ${this.logline}

CURRENT POSITION: Chapter ${chapterNumber} of ${this.totalChapters}
NARRATIVE PHASE: ${phase.toUpperCase().replace('_', ' ')}
GUIDANCE: ${guidance}
${currentPlotPoint ? `\nCURRENT PLOT POINT: ${currentPlotPoint}` : ''}
${this.formatOutlineContext()}
───────────────────────────────────────────────────────────────────────────────
STORY SO FAR
───────────────────────────────────────────────────────────────────────────────
${this.getRollingSummary()}

───────────────────────────────────────────────────────────────────────────────
ACTIVE CHARACTERS
───────────────────────────────────────────────────────────────────────────────
${this.formatCharactersForContext()}

───────────────────────────────────────────────────────────────────────────────
ESTABLISHED WORLD RULES (DO NOT CONTRADICT)
───────────────────────────────────────────────────────────────────────────────
${this.formatWorldFactsForContext()}

───────────────────────────────────────────────────────────────────────────────
PREVIOUS CHOICES
───────────────────────────────────────────────────────────────────────────────
${this.formatChoiceHistory()}
${this.formatProtagonistPsychology()}
${this.formatAuthorStyleContext()}
═══════════════════════════════════════════════════════════════════════════════
END STORY BIBLE
═══════════════════════════════════════════════════════════════════════════════`;

    return context;
  }

  addCharacter(name, role, traits = [], relationships = {}, fullPsychology = null) {
    this.characters[name] = { 
      name, 
      role, 
      traits, 
      relationships, 
      status: 'active', 
      introducedChapter: this.currentChapter,
      // V4: Store full psychology for NPCs with emergent backstories
      psychology: fullPsychology ? {
        attachment_style: fullPsychology.attachment?.attachment_style,
        core_beliefs: fullPsychology.attachment?.core_beliefs,
        internal_working_models: fullPsychology.attachment?.internal_working_models,
        emotional_climate: fullPsychology.atmospheric_conditions?.emotional_climate,
        cultural_identity: fullPsychology.cultural_identity?.ethnicity
      } : null
    };
  }

  addWorldFact(fact, category, importance = 'normal') {
    this.worldFacts.push({ fact, category, importance, establishedChapter: this.currentChapter });
  }

  addChapterSummary(number, title, summary) {
    this.chapterSummaries.push({ number, title, summary, phase: this.calculatePhase(number) });
  }

  recordChoice(chapter, choiceId, description) {
    this.choiceHistory.push({ chapter, choiceId, description, timestamp: new Date().toISOString() });
  }

  clone() {
    const newBible = new StoryBible(this.title, this.genre, this.logline, this.tone);
    Object.assign(newBible, JSON.parse(JSON.stringify(this)));
    return newBible;
  }
}

// ============================================
// SECTION 6: AI PROVIDERS
// ============================================

// AI Providers - Uses Vercel serverless functions to avoid CORS issues
// API keys are stored in Vercel environment variables, not in the browser
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI GPT-4.1',
    endpoint: '/api/openai', // Vercel serverless function
    model: 'gpt-4.1',
    formatHeaders: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (systemPrompt, userPrompt) => ({
      model: 'gpt-4.1',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }),
    extractResponse: (data) => data.choices?.[0]?.message?.content
  },
  anthropic: {
    name: 'Claude Sonnet 4',
    endpoint: '/api/anthropic', // Vercel serverless function
    model: 'claude-sonnet-4-20250514',
    formatHeaders: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (systemPrompt, userPrompt) => ({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    }),
    extractResponse: (data) => data.content?.[0]?.text
  }
};

// ============================================
// SECTION 7: GENRE DATA & CONSTANTS
// ============================================

// Achievement definitions for user profile
const ACHIEVEMENTS = {
  'first_story': { name: 'First Steps', description: 'Created your first story', icon: '📖' },
  'storyteller': { name: 'Storyteller', description: 'Created 5 stories', icon: '✨' },
  'prolific_author': { name: 'Prolific Author', description: 'Created 10 stories', icon: '🏆' },
  'first_completion': { name: 'The End', description: 'Completed your first story', icon: '🎬' },
  'finisher': { name: 'Finisher', description: 'Completed 5 stories', icon: '🎯' },
  'character_creator': { name: 'Character Creator', description: 'Generated your first character', icon: '👤' },
  'character_master': { name: 'Character Master', description: 'Generated 10 characters', icon: '👥' },
  'bookworm': { name: 'Bookworm', description: 'Read 50 chapters', icon: '📚' },
  'dedicated_reader': { name: 'Dedicated Reader', description: 'Read 100 chapters', icon: '🌟' },
  'streak_starter': { name: 'Streak Starter', description: '3-day reading streak', icon: '🔥' },
  'streak_keeper': { name: 'Streak Keeper', description: '7-day reading streak', icon: '💪' },
  'genre_explorer': { name: 'Genre Explorer', description: 'Tried 5 different genres', icon: '🗺️' }
};

// Genre to image file mapping (for visual polish)
const GENRE_IMAGES = {
  fantasy: 'fantasy.png',
  darkFantasy: 'fantasy.png',
  scifi: 'scifi.png',
  cyberpunk: 'scifi.png',
  retroScifi: 'scifi.png',
  horror: 'horror.png',
  gothic: 'horror.png',
  romance: 'romance.png',
  romcom: 'romance.png',
  thriller: 'thriller.png',
  noir: 'thriller.png',
  western: 'western.png',
  dystopian: 'dystopian.png',
  action: 'action.png'
};

// ============================================
// EXPANDED GENRES (26+ from iOS app)
// Each genre has specific story formulas and author style matching
// ============================================

const genres = {
  fantasy: {
    icon: '⚔️',
    name: 'Epic Fantasy',
    prompt: 'Generate an epic fantasy story premise with magic, kingdoms, quests, or mythical creatures. Think Game of Thrones, Lord of the Rings, Name of the Wind.',
    formula: ['World-Building', 'Magic System Intro', 'Quest Setup', 'Journey Begins', 'First Challenge', 'Ally Found', 'Enemy Revealed', 'Artifact Discovery', 'Major Battle', 'Return Home'],
    eras: ['1200s', '1400s', '1600s']
  },
  darkFantasy: {
    icon: '🗡️',
    name: 'Dark Fantasy',
    prompt: 'Generate a dark fantasy premise with morally gray characters, gritty realism, and subverted tropes. Think Joe Abercrombie, Glen Cook, Mark Lawrence.',
    formula: ['Grim Introduction', 'Moral Compromise', 'Alliance of Necessity', 'Betrayal', 'Darker Depths', 'Pyrrhic Victory', 'Cost Revealed', 'Final Reckoning'],
    eras: ['1200s', '1400s', '1600s']
  },
  scifi: {
    icon: '🚀',
    name: 'Science Fiction',
    prompt: 'Generate a science fiction story premise involving future technology, space, AI, dystopia, or scientific discovery. Think Blade Runner, Dune, Black Mirror.',
    formula: ['World State', 'Technology Introduction', 'Discovery/Problem', 'Investigation', 'Revelation', 'Stakes Escalate', 'Confrontation', 'Resolution'],
    eras: ['2050s', '2100s', '2200s']
  },
  cyberpunk: {
    icon: '🌃',
    name: 'Cyberpunk',
    prompt: 'Generate a cyberpunk story premise with neon-lit dystopia, hackers, corporations, and the intersection of humanity and technology. Think William Gibson, Blade Runner.',
    formula: ['Neon Introduction', 'Job Offer', 'Corporate Conspiracy', 'Digital Infiltration', 'Betrayal', 'Chase', 'Revelation', 'System Crash'],
    eras: ['2050s', '2100s']
  },
  retroScifi: {
    icon: '📺',
    name: '70s Sci-Fi',
    prompt: 'Generate a thoughtful 1970s-style science fiction premise exploring social themes through alien encounters or future societies. Think Ursula K. Le Guin, Philip K. Dick.',
    formula: ['Strange World', 'Cultural Encounter', 'Philosophical Question', 'Society Revealed', 'Identity Crisis', 'Truth Discovered', 'Choice Made'],
    eras: ['2050s', '2100s']
  },
  mystery: {
    icon: '🔍',
    name: 'Mystery',
    prompt: 'Generate a mystery story premise with intricate puzzles, red herrings, and satisfying reveals. Think Agatha Christie, Tana French, Louise Penny.',
    formula: ['Crime Scene', 'Detective Intro', 'First Clues', 'Suspect Pool', 'Red Herring', 'Key Discovery', 'Confrontation', 'Revelation'],
    eras: ['1920s', '1950s', '2000s', '2010s']
  },
  thriller: {
    icon: '⚡',
    name: 'Thriller',
    prompt: 'Generate a high-stakes thriller premise with tension, danger, and relentless pacing. Think Dan Brown, Lee Child, Gillian Flynn.',
    formula: ['Inciting Incident', 'Stakes Established', 'Pursuit Begins', 'False Safety', 'Betrayal', 'All Seems Lost', 'Final Confrontation', 'Twist Resolution'],
    eras: ['1980s', '1990s', '2000s', '2010s']
  },
  noir: {
    icon: '🎩',
    name: 'Noir Crime',
    prompt: 'Generate a hardboiled noir crime premise with morally ambiguous characters, femme fatales, and corruption. Think Raymond Chandler, Dashiell Hammett.',
    formula: ['Case Arrives', 'First Lead', 'Femme Fatale', 'Double Cross', 'Violence', 'Deeper Conspiracy', 'Confrontation', 'Bitter Resolution'],
    eras: ['1940s', '1950s', '1970s']
  },
  romance: {
    icon: '💫',
    name: 'Romance',
    prompt: 'Generate a romance story premise with compelling relationship dynamics, emotional tension, and heart. Think Nicholas Sparks, Nora Roberts.',
    formula: ['Meet Cute', 'Initial Attraction', 'First Obstacle', 'Growing Closer', 'Intimate Moment', 'Major Conflict', 'Separation', 'Grand Gesture', 'Happily Ever After'],
    eras: ['1800s', '1920s', '1990s', '2010s']
  },
  romcom: {
    icon: '😂',
    name: 'Romantic Comedy',
    prompt: 'Generate a light-hearted romantic comedy premise with witty banter, comedic mishaps, and heartwarming romance. Think Sophie Kinsella, rom-com movies.',
    formula: ['Awkward Meeting', 'Misunderstanding', 'Forced Proximity', 'Comic Disaster', 'Feelings Emerge', 'Revelation', 'Grand Romantic Gesture'],
    eras: ['1990s', '2000s', '2010s']
  },
  horror: {
    icon: '🌑',
    name: 'Horror',
    prompt: 'Generate a horror story premise that unsettles and terrifies. Psychological horror, supernatural, or cosmic dread. Think Stephen King, Shirley Jackson.',
    formula: ['Normal Life', 'First Sign', 'Denial', 'Investigation', 'Horror Revealed', 'Failed Escape', 'Confrontation', 'Ambiguous End'],
    eras: ['1970s', '1990s', '2010s']
  },
  gothic: {
    icon: '🏚️',
    name: 'Gothic',
    prompt: 'Generate a gothic story premise with decaying mansions, family secrets, supernatural atmosphere, and romantic darkness. Think Daphne du Maurier, Anne Rice.',
    formula: ['Arrival at Estate', 'Strange Encounters', 'Family Secret Hints', 'Romance Blooms', 'Horror Revealed', 'Past Uncovered', 'Confrontation', 'Escape or Doom'],
    eras: ['1800s', '1900s', '1950s']
  },
  literary: {
    icon: '📖',
    name: 'Literary Fiction',
    prompt: 'Generate a literary fiction premise exploring the human condition, relationships, identity, or social themes. Think Donna Tartt, Kazuo Ishiguro, Celeste Ng.',
    formula: ['Character Introduction', 'Daily Life', 'Disruption', 'Internal Conflict', 'Relationship Shift', 'Realization', 'Change or Acceptance'],
    eras: ['1950s', '1980s', '2010s']
  },
  youngAdult: {
    icon: '🌟',
    name: 'Young Adult',
    prompt: 'Generate a young adult story premise with coming-of-age themes, identity exploration, and relatable struggles. Think John Green, Suzanne Collins.',
    formula: ['Ordinary World', 'Call to Change', 'Friendship Formed', 'First Love', 'Major Challenge', 'Identity Crisis', 'Standing Up', 'New Understanding'],
    eras: ['1990s', '2000s', '2010s']
  },
  historical: {
    icon: '🏛️',
    name: 'Historical Fiction',
    prompt: 'Generate a historical fiction premise that brings the past alive with rich period detail and human drama. Think Ken Follett, Hilary Mantel.',
    formula: ['Era Established', 'Character Position', 'Historical Event', 'Personal Stakes', 'Conflict', 'Survival', 'History Changed'],
    eras: ['1800s', '1900s', '1940s', '1960s']
  },
  dystopian: {
    icon: '⚠️',
    name: 'Dystopian',
    prompt: 'Generate a dystopian premise with oppressive societies, rebellion, and the fight for freedom. Think 1984, Brave New World, The Handmaid\'s Tale.',
    formula: ['Oppressive World', 'Protagonist\'s Role', 'Cracks Appear', 'Forbidden Knowledge', 'Rebellion Contact', 'Stakes Raised', 'Uprising', 'Victory or Defeat'],
    eras: ['2050s', '2100s']
  },
  paranormal: {
    icon: '👻',
    name: 'Paranormal',
    prompt: 'Generate a paranormal story premise with vampires, werewolves, ghosts, or supernatural romance. Think Anne Rice, Charlaine Harris.',
    formula: ['Normal World', 'Supernatural Encounter', 'Powers/Transformation', 'Hidden World', 'Forbidden Connection', 'Threat Emerges', 'Final Battle'],
    eras: ['1990s', '2000s', '2010s']
  },
  adventure: {
    icon: '🗺️',
    name: 'Adventure',
    prompt: 'Generate an adventure story premise with exploration, treasure, danger, and exotic locations. Think Clive Cussler, Indiana Jones.',
    formula: ['Call to Adventure', 'Team Assembly', 'First Obstacle', 'Discovery', 'Villain Pursuit', 'Race Against Time', 'Final Challenge', 'Treasure Secured'],
    eras: ['1930s', '1980s', '2000s']
  },
  action: {
    icon: '💥',
    name: 'Action',
    prompt: 'Generate an action story premise with high-octane sequences, skilled protagonists, and explosive conflicts. Think Tom Clancy, Lee Child.',
    formula: ['Mission Brief', 'Infiltration', 'First Fight', 'Setback', 'Regroup', 'Final Assault', 'Boss Battle', 'Aftermath'],
    eras: ['1980s', '1990s', '2000s', '2010s']
  },
  western: {
    icon: '🤠',
    name: 'Western',
    prompt: 'Generate a western premise with frontier justice, outlaws, and the untamed American West. Think Louis L\'Amour, Cormac McCarthy.',
    formula: ['Stranger Arrives', 'Town\'s Problem', 'Allies Made', 'Enemy Confronted', 'Escalation', 'Final Showdown', 'Ride Off'],
    eras: ['1860s', '1880s', '1900s']
  },
  crime: {
    icon: '🔫',
    name: 'Crime',
    prompt: 'Generate a crime story premise with investigations, criminals, and the gray areas of justice. Think Michael Connelly, Dennis Lehane.',
    formula: ['Crime Committed', 'Investigation Begins', 'First Lead', 'Deeper Conspiracy', 'Personal Stakes', 'Confrontation', 'Justice (or Not)'],
    eras: ['1970s', '1990s', '2010s']
  },
  satire: {
    icon: '😏',
    name: 'Satire',
    prompt: 'Generate a satirical story premise that skewers society, politics, or human nature with dark humor. Think Terry Pratchett, Douglas Adams, Kurt Vonnegut.',
    formula: ['Absurd World', 'Naive Protagonist', 'System Encountered', 'Absurdity Escalates', 'Commentary', 'Darkly Comic Resolution'],
    eras: ['1950s', '1980s', '2010s']
  },
  magicRealism: {
    icon: '✨',
    name: 'Magic Realism',
    prompt: 'Generate a magic realism premise where fantastical elements blend seamlessly with everyday life. Think Gabriel García Márquez, Isabel Allende.',
    formula: ['Ordinary Life', 'Magic Introduced', 'Acceptance', 'Deeper Magic', 'Transformation', 'Understanding'],
    eras: ['1950s', '1970s', '2000s']
  },
  biography: {
    icon: '📝',
    name: 'Biography',
    prompt: 'Generate a biographical fiction premise exploring a fascinating life, real or imagined, with depth and authenticity. Think Walter Isaacson, Erik Larson.',
    formula: ['Origin', 'Early Struggles', 'Defining Moment', 'Rise', 'Crisis', 'Legacy'],
    eras: ['1900s', '1950s', '1980s', '2000s']
  },
  standup: {
    icon: '🎤',
    name: 'Comedy (Nate Bargatze)',
    prompt: 'Generate a humorous first-person narrative premise in the style of clean observational comedy, finding absurdity in everyday life. Think Nate Bargatze, Brian Regan.',
    formula: ['Setup', 'Observation', 'Escalation', 'Callback', 'Punchline'],
    eras: ['2000s', '2010s']
  },
  graphicNovel: {
    icon: '💬',
    name: 'Graphic Novel',
    prompt: 'Generate a visually-driven story premise suited for graphic novel format with bold scenes and visual storytelling. Think Alan Moore, Neil Gaiman\'s Sandman.',
    formula: ['Visual Hook', 'World Established', 'Conflict', 'Visual Climax', 'Resolution'],
    eras: ['1980s', '2000s', '2010s']
  }
};

// ============================================
// SECTION 8: MAIN REACT COMPONENT
// ============================================

export default function Loomiverse() {
  // Core state
  const [screen, setScreen] = useState('landing');
  const [storage] = useState(() => new StorageManager());
  const [generator] = useState(() => new CharacterGenerator());
  
  // Character state
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [generatingCharacter, setGeneratingCharacter] = useState(false);
  const [simulatingChildhood, setSimulatingChildhood] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  
  // Story state
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [currentStory, setCurrentStory] = useState(null);
  const [storyBible, setStoryBible] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [savedStories, setSavedStories] = useState([]);
  const [choiceMade, setChoiceMade] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showBible, setShowBible] = useState(false);
  const [expandedCharacter, setExpandedCharacter] = useState(null);
  const [characterFilter, setCharacterFilter] = useState('all'); // 'all', 'user', 'story'
  
  // Settings
  const [primaryProvider, setPrimaryProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  // Initialize
  useEffect(() => {
    setCharacters(storage.getCharacters());
    setSavedStories(storage.listStories());
    setOpenaiKey(storage.getApiKey('openai'));
    setAnthropicKey(storage.getApiKey('anthropic'));
    setPrimaryProvider(storage.getSetting('primaryProvider', 'openai'));
  }, []);

  // Save settings
  const saveSettings = () => {
    storage.saveApiKey('openai', openaiKey);
    storage.saveApiKey('anthropic', anthropicKey);
    storage.saveSetting('primaryProvider', primaryProvider);
    setShowSettings(false);
  };

  // Generate new character
  const generateNewCharacter = async () => {
    setGeneratingCharacter(true);
    
    const character = generator.generate();
    
    // Generate name using AI based on character's background
    const name = await generateCharacterName({
      genreName: 'character study',
      storyTitle: null,
      role: 'protagonist',
      ethnicity: character.cultural_identity?.ethnicity || 'unspecified',
      sex: character.biology?.sex || 'M',
      era: character.world?.era || '2010s'
    });
    
    character.name = name;
    character.origin = 'user';
    
    storage.saveCharacter(character, 'user');
    setCharacters(storage.getCharacters());
    setSelectedCharacter(character);
    setGeneratingCharacter(false);
  };

  // Simulate childhood
  const simulateChildhood = async (character) => {
    setSimulatingChildhood(true);
    setSimulationProgress(0);
    
    const simulator = new EventSimulator(character);
    
    // Simulate with progress updates
    const results = await new Promise(resolve => {
      let eventCount = 0;
      const totalExpected = 120; // Approximate
      
      const interval = setInterval(() => {
        setSimulationProgress(Math.min(95, (eventCount / totalExpected) * 100));
      }, 100);
      
      setTimeout(() => {
        const results = simulator.simulateChildhood(0, 18, () => {
          eventCount++;
        });
        clearInterval(interval);
        setSimulationProgress(100);
        resolve(results);
      }, 100);
    });
    
    // Update character with results
    const updatedCharacter = {
      ...character,
      simulated: true,
      simulation_results: results,
      attachment: {
        ...character.attachment,
        core_beliefs: results.final_beliefs
      }
    };
    
    storage.saveCharacter(updatedCharacter);
    setCharacters(storage.getCharacters());
    setSelectedCharacter(updatedCharacter);
    setSimulatingChildhood(false);
  };

  // Start story with character
  const startStoryWithCharacter = (character) => {
    setSelectedCharacter(character);
    setScreen('genre');
  };

  // Select genre and story
  // Generate unique story premise via AI
  const generatePremise = async (genre) => {
    const genreData = genres[genre];
    const providers = primaryProvider === 'openai' 
      ? ['openai', 'anthropic'] 
      : ['anthropic', 'openai'];
    
    const systemPrompt = `You are a creative story generator. Generate a unique, compelling story premise for a ${genreData.name} story.

${genreData.prompt}

Create something FRESH and ORIGINAL - not a rehash of existing stories. The premise should be specific enough to be intriguing but open enough to allow for branching narratives.

Output ONLY valid JSON:
{
  "title": "A compelling, evocative title (2-5 words)",
  "logline": "A single sentence (30-50 words) that hooks the reader with the protagonist, conflict, and stakes"
}`;

    for (const providerKey of providers) {
      const provider = AI_PROVIDERS[providerKey];

      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.formatHeaders(),
          body: JSON.stringify(provider.formatRequest(systemPrompt, `Generate a unique ${genreData.name} story premise. Return ONLY valid JSON.`))
        });

        if (!response.ok) continue;

        const data = await response.json();
        const text = provider.extractResponse(data);
        
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error(`${providerKey} premise generation failed:`, e);
        continue;
      }
    }

    // Fallback if no API available
    const fallbackPremises = {
      fantasy: { title: 'The Untold Kingdom', logline: 'A wanderer discovers they alone can hear the dying words of an ancient god, words that could reshape the world or destroy it.' },
      scifi: { title: 'Echo Protocol', logline: 'When your digital backup wakes up before you die, you must hunt down the copy of yourself that\'s already living your life.' },
      mystery: { title: 'The Last Confession', logline: 'A priest receives a deathbed confession that implicates someone still very much alive—and very dangerous.' },
      romance: { title: 'Second First Impressions', logline: 'After a head injury erases six months of memories, she must decide whether to fall for her fiancé all over again—or trust the doubts she can\'t remember having.' },
      horror: { title: 'The Watching Hours', logline: 'Every night at 3:33 AM, something in the house moves—and it\'s been getting closer to the bedroom door.' },
      literary: { title: 'The Space Between Us', logline: 'Two estranged siblings return home to sort their late mother\'s possessions and discover a secret that rewrites their entire childhood.' }
    };
    return fallbackPremises[genre] || fallbackPremises.literary;
  };

  // Generate story outline (ported from iOS app)
  // This creates a roadmap before Chapter 1 for better narrative structure
  const generateOutline = async (genre, title, logline) => {
    const genreData = genres[genre];
    const formula = genreData?.formula || [];

    const providers = primaryProvider === 'openai'
      ? ['openai', 'anthropic']
      : ['anthropic', 'openai'];

    const systemPrompt = `You are a master story architect. Create a detailed chapter-by-chapter outline for a 10-chapter ${genreData.name} story.

STORY TITLE: ${title}
LOGLINE: ${logline}

${formula.length > 0 ? `GENRE FORMULA (use as structural guide):
${formula.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : ''}

Create 10 plot points, one for each chapter. Each point should be a single compelling sentence describing the key event/development of that chapter.

Output ONLY a valid JSON array of 10 strings:
["Chapter 1 plot point", "Chapter 2 plot point", ...]

Guidelines:
- Follow the genre formula beats when provided
- Build tension through the middle chapters
- Include a major twist or revelation around chapter 6-7
- Build to a satisfying climax in chapters 8-9
- Each point should naturally flow from the previous`;

    for (const providerKey of providers) {
      const provider = AI_PROVIDERS[providerKey];

      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.formatHeaders(),
          body: JSON.stringify(provider.formatRequest(systemPrompt, 'Generate the 10-chapter story outline. Return ONLY valid JSON array.'))
        });

        if (!response.ok) continue;

        const data = await response.json();
        const text = provider.extractResponse(data);

        if (text) {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const outline = JSON.parse(jsonMatch[0]);
            if (Array.isArray(outline) && outline.length >= 5) {
              return outline.slice(0, 10); // Ensure max 10 points
            }
          }
        }
      } catch (e) {
        console.error(`${providerKey} outline generation failed:`, e);
        continue;
      }
    }

    // Fallback: Use genre formula as outline if API fails
    if (formula.length > 0) {
      return formula.slice(0, 10);
    }

    // Generic fallback outline
    return [
      'Introduction: The protagonist\'s ordinary world is established',
      'Inciting incident disrupts the status quo',
      'The protagonist commits to action',
      'New allies and enemies emerge',
      'First major obstacle is overcome',
      'Midpoint revelation changes everything',
      'Stakes escalate dramatically',
      'All seems lost in the dark moment',
      'Climactic confrontation',
      'Resolution and new equilibrium'
    ];
  };

  // Generate MULTIPLE character names in ONE API call - much faster
  const generateCharacterNames = async (characters, genreName, storyTitle) => {
    const providers = primaryProvider === 'openai' 
      ? ['openai', 'anthropic'] 
      : ['anthropic', 'openai'];
    
    const characterList = characters.map((c, i) => 
      `${i + 1}. ${c.role} - ${c.sex === 'M' ? 'male' : 'female'}, ${c.ethnicity || 'any background'}, ${c.era || 'contemporary'}`
    ).join('\n');
    
    const systemPrompt = `You are a creative naming expert. Generate fitting character names for a ${genreName} story titled "${storyTitle}".

Characters needed:
${characterList}

Return ONLY valid JSON array: [{"role": "RoleName", "name": "FirstName"}, ...]

Guidelines:
- Names should fit the genre and tone
- Consider cultural authenticity  
- Make names memorable and pronounceable
- Just first names, no surnames
- Each name should be distinct`;

    for (const providerKey of providers) {
      const provider = AI_PROVIDERS[providerKey];

      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.formatHeaders(),
          body: JSON.stringify(provider.formatRequest(systemPrompt, 'Generate all character names. Return ONLY valid JSON array.'))
        });

        if (!response.ok) continue;

        const data = await response.json();
        const text = provider.extractResponse(data);
        
        if (text) {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const results = JSON.parse(jsonMatch[0]);
            // Convert to map for easy lookup
            const nameMap = {};
            results.forEach(r => nameMap[r.role] = r.name);
            return nameMap;
          }
        }
      } catch (e) {
        console.error(`${providerKey} batch name generation failed:`, e);
        continue;
      }
    }

    // Fallback - use roles as names
    const fallback = {};
    characters.forEach(c => fallback[c.role] = c.role);
    return fallback;
  };

  // Generate single character name using AI (kept for standalone use)
  const generateCharacterName = async (context) => {
    const { genreName, storyTitle, role, ethnicity, sex, era } = context;
    
    const providers = primaryProvider === 'openai' 
      ? ['openai', 'anthropic'] 
      : ['anthropic', 'openai'];
    
    const systemPrompt = `You are a creative naming expert. Generate a fitting character name.

Context:
- Genre: ${genreName || 'general fiction'}
- Story: "${storyTitle || 'untitled'}"
- Character role: ${role || 'protagonist'}
- Cultural background: ${ethnicity || 'unspecified'}
- Sex: ${sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'any'}
- Era/Setting: ${era || 'contemporary'}

Return ONLY valid JSON: {"name": "FirstName"}

Guidelines:
- Name should fit the genre and tone (fantasy names for fantasy, realistic for contemporary, etc.)
- Consider cultural authenticity when ethnicity is specified
- Make it memorable and pronounceable
- Just a first name, no surname`;

    for (const providerKey of providers) {
      const provider = AI_PROVIDERS[providerKey];

      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.formatHeaders(),
          body: JSON.stringify(provider.formatRequest(systemPrompt, 'Generate a character name. Return ONLY valid JSON.'))
        });

        if (!response.ok) continue;

        const data = await response.json();
        const text = provider.extractResponse(data);
        
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return result.name;
          }
        }
      } catch (e) {
        console.error(`${providerKey} name generation failed:`, e);
        continue;
      }
    }

    // Fallback only if no API - use role as name
    return role || 'Stranger';
  };

  const selectGenre = async (genre) => {
    setSelectedGenre(genre);
    setLoading(true);
    setLoadingText('Generating your unique story...');

    const genreData = genres[genre];

    // Generate unique AI premise (API call #1)
    const premise = await generatePremise(genre);
    setCurrentStory(premise);

    const bible = new StoryBible(premise.title, genreData.name, premise.logline);

    // NEW: Select author style for this story (from iOS AuthorStyles.json)
    const authorStyle = getRandomAuthorForGenre(genreData.name);
    if (authorStyle) {
      bible.setAuthorStyle(authorStyle);
      console.log(`Selected author style: ${authorStyle.name}`);
    }

    // NEW: Set genre formula for structural guidance
    if (genreData.formula) {
      bible.setGenreFormula(genreData.formula);
    }

    // NEW: Generate story outline (API call #2 - ported from iOS app)
    setLoadingText('Architecting your story...');
    const outline = await generateOutline(genre, premise.title, premise.logline);
    bible.setStoryOutline(outline);
    console.log('Story outline generated:', outline);

    // Collect all characters that need names
    const charactersToName = [];
    let protagonistSeed = null;
    let protagonistSimResult = null;

    // Generate protagonist seed if none selected
    if (selectedCharacter) {
      bible.setProtagonist(selectedCharacter);
    } else {
      setLoadingText('Creating your protagonist...');

      // Generate protagonist with genre-appropriate era (now uses genre's eras if defined)
      const eras = genreData.eras || Object.keys(ERAS);
      const era = eras[Math.floor(Math.random() * eras.length)];
      
      const generator = new CharacterGenerator();
      protagonistSeed = generator.generateSeed(era);
      
      // Run simulation (local, fast)
      setLoadingText('Simulating childhood experiences...');
      const simulator = new EventSimulator(protagonistSeed);
      protagonistSimResult = simulator.simulateChildhood();
      
      // Add to naming queue
      charactersToName.push({
        role: 'Protagonist',
        ethnicity: protagonistSeed.cultural_identity?.ethnicity || 'unspecified',
        sex: protagonistSeed.biology?.sex || 'M',
        era
      });
    }
    
    // Generate 2-3 supporting NPCs seeds (local, fast)
    setLoadingText('Populating the world...');
    const supportingRoles = ['Mentor', 'Ally', 'Rival', 'Love Interest', 'Guardian', 'Trickster'];
    const numSupporting = 2 + Math.floor(Math.random() * 2);
    const selectedRoles = [];
    const npcSeeds = [];
    
    for (let i = 0; i < numSupporting; i++) {
      const availableRoles = supportingRoles.filter(r => !selectedRoles.includes(r));
      const role = availableRoles[Math.floor(Math.random() * availableRoles.length)];
      selectedRoles.push(role);
      
      const generator = new CharacterGenerator();
      const npcSeed = generator.generateSeed();
      npcSeeds.push({ seed: npcSeed, role });
      
      // Add to naming queue
      charactersToName.push({
        role,
        ethnicity: npcSeed.cultural_identity?.ethnicity || 'unspecified',
        sex: npcSeed.biology?.sex || (Math.random() > 0.5 ? 'M' : 'F'),
        era: npcSeed.world?.era || '2010s'
      });
    }
    
    // Generate ALL names in ONE API call (#2)
    setLoadingText('Naming your characters...');
    const names = await generateCharacterNames(charactersToName, genreData.name, premise.title);
    
    // Now apply names to characters
    if (protagonistSeed) {
      const protagonist = {
        ...protagonistSeed,
        id: `char_${Date.now()}`,
        name: names['Protagonist'] || 'Unknown',
        simulated: true,
        simulation_results: protagonistSimResult,
        origin: 'story',
        originStoryId: bible.storyId,
        originStoryTitle: premise.title,
        role: 'Protagonist'
      };
      
      storage.saveCharacter(protagonist, 'story', bible.storyId, premise.title);
      setCharacters(storage.getCharacters());
      bible.setProtagonist(protagonist);
    }
    
    // Add NPCs with their names
    for (const { seed, role } of npcSeeds) {
      bible.addCharacter(names[role] || role, role, [
        seed.attachment?.attachment_style || 'unknown',
        seed.atmospheric_conditions?.emotional_climate || 'neutral'
      ], {}, seed);
    }
    
    setStoryBible(bible);
    setLoading(false);
    setScreen('setup');
  };

  // Generate chapter via AI
  const generateChapter = async (chapterNum) => {
    const providers = primaryProvider === 'openai'
      ? ['openai', 'anthropic']
      : ['anthropic', 'openai'];

    // Get author style name for prompt enhancement
    const authorName = storyBible?.authorStyle?.name || 'a masterful storyteller';

    const systemPrompt = `You are ${authorName}, creating an interactive Choose Your Own Adventure story. Write literary quality prose with vivid imagery, strong character voices, and proper pacing. Each chapter should be 600-900 words.

CRITICAL REQUIREMENTS:
1. CONTINUITY: Maintain strict continuity with the Story Bible. Use character names EXACTLY as established. NEVER contradict established world facts.
2. CHARACTER PSYCHOLOGY: If protagonist psychology is provided, their reactions and behaviors MUST reflect their attachment style, core beliefs, and coping patterns.
3. STORY OUTLINE: Follow the story outline progression - hit the plot point for this chapter.
4. WRITING STYLE: If writing style guidance is provided in the context, embody that author's voice, pacing, and storytelling techniques.

Output ONLY valid JSON in this format:
{
  "title": "Chapter title",
  "content": "The chapter prose with paragraphs separated by double newlines...",
  "choices": [
    {"id": "choice_a", "text": "First choice option", "hint": "Consequence hint"},
    {"id": "choice_b", "text": "Second choice option", "hint": "Consequence hint"},
    {"id": "choice_c", "text": "Third choice option", "hint": "Consequence hint"}
  ],
  "summary": "2-3 sentence summary",
  "newCharacters": [{"name": "Name", "role": "role", "traits": ["trait1"]}],
  "newWorldFacts": [{"fact": "Fact", "category": "history", "importance": "critical"}],
  "endingHook": "Tension/question for next chapter"
}`;

    const context = storyBible.buildContextInjection(chapterNum);
    const userPrompt = `${context}\n\nWrite Chapter ${chapterNum}. Return ONLY valid JSON.`;

    for (const providerKey of providers) {
      const provider = AI_PROVIDERS[providerKey];

      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: provider.formatHeaders(),
          body: JSON.stringify(provider.formatRequest(systemPrompt, userPrompt))
        });

        if (!response.ok) continue;

        const data = await response.json();
        const text = provider.extractResponse(data);
        
        if (text) {
          // Parse JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const chapter = JSON.parse(jsonMatch[0]);
            chapter._generatedBy = providerKey;
            return chapter;
          }
        }
      } catch (e) {
        console.error(`${providerKey} failed:`, e);
        continue;
      }
    }

    // Fallback to demo
    return getDemoChapter(chapterNum);
  };

  // Demo chapters as fallback
  const getDemoChapter = (num) => {
    const demos = {
      1: {
        title: "The Forge's Secret",
        content: `The hammer fell like thunder, sparks dancing like captured stars. ${selectedCharacter?.name || 'The protagonist'} wiped soot from brow, muscles aching, yet unable to stop. Something whispered in the metal tonight.

"Still at it?" Master Aldric's weathered face held fear. "Put down the hammer."

"I can't." Hands moved of their own accord, shaping metal glowing impossible gold—not red iron, but pure burning gold.

The forge fire roared wilder, pressing against the ceiling. In its heart, a crown made of living flame waited.

"The blood remembers," Aldric whispered. "The fire mage bloodline wasn't extinguished after all."`,
        choices: [
          { id: 'reach', text: 'Reach into the flames toward the crown', hint: 'Embrace your power' },
          { id: 'flee', text: 'Drop the hammer and flee the forge', hint: 'Deny your heritage' },
          { id: 'question', text: 'Demand answers from Aldric first', hint: 'Seek knowledge' }
        ],
        summary: "Discovers forbidden fire magic. Mentor Aldric reveals fire mage bloodline.",
        newCharacters: [
          { name: selectedCharacter?.name || 'Protagonist', role: 'Protagonist', traits: ['determined', 'curious'] },
          { name: 'Master Aldric', role: 'Mentor', traits: ['wise', 'secretive'] }
        ],
        newWorldFacts: [
          { fact: 'Fire mages once ruled but were hunted to extinction', category: 'history', importance: 'critical' },
          { fact: 'The Ember Crown is a legendary fire magic artifact', category: 'magic', importance: 'critical' }
        ],
        _generatedBy: 'demo'
      },
      2: {
        title: "Blood and Fire",
        content: `Morning light found ${selectedCharacter?.name || 'them'} sleepless, haunted by the flaming crown. Aldric watched nervously.

"What happened last night?" The demand came sharp.

Heavy silence. Then: "Twenty years ago, fire mages ruled. The Ember Crown was real. I saw it."

"How?"

"I was there when King Varen's soldiers killed its last wearer." His voice dropped. "Your mother."`,
        choices: [
          { id: 'demand', text: 'Demand everything about your mother', hint: 'Learn your history' },
          { id: 'power', text: 'Try to summon the flames again', hint: 'Test abilities' },
          { id: 'leave', text: 'Leave to protect Aldric from danger', hint: 'Protect mentor' }
        ],
        summary: "Aldric reveals mother wore the Ember Crown before being killed by the king.",
        newCharacters: [],
        newWorldFacts: [
          { fact: "Protagonist's mother was the last fire mage queen", category: 'history', importance: 'critical' }
        ],
        _generatedBy: 'demo'
      }
    };
    return demos[num] || demos[1];
  };

  // Begin story
  const beginStory = async () => {
    if (!storyBible) return;
    setLoading(true);
    setLoadingText('Opening Chapter One...');

    const bible = storyBible.clone();
    bible.currentChapter = 1;

    try {
      const chapter = await generateChapter(1);
      
      bible.addChapterSummary(1, chapter.title, chapter.summary);
      if (chapter.newCharacters) {
        chapter.newCharacters.forEach(c => bible.addCharacter(c.name, c.role, c.traits || []));
      }
      if (chapter.newWorldFacts) {
        chapter.newWorldFacts.forEach(f => bible.addWorldFact(f.fact, f.category, f.importance));
      }

      setStoryBible(bible);
      setChapterData(chapter);
      setChoiceMade(false);
      setScreen('reading');
    } catch (error) {
      console.error('Error generating chapter:', error);
    }
    
    setLoading(false);
  };

  // Make choice
  const makeChoice = (choiceId, choiceText) => {
    if (!storyBible) return;
    const bible = storyBible.clone();
    bible.recordChoice(bible.currentChapter, choiceId, choiceText);
    setStoryBible(bible);
    setChoiceMade(true);
  };

  // Next chapter
  const nextChapter = async () => {
    if (!storyBible) return;
    const bible = storyBible.clone();
    bible.currentChapter++;

    if (bible.currentChapter > bible.totalChapters) {
      alert('🎉 Story complete!');
      return;
    }

    setLoading(true);
    setLoadingText(`Crafting Chapter ${bible.currentChapter}...`);

    try {
      const chapter = await generateChapter(bible.currentChapter);
      
      bible.addChapterSummary(bible.currentChapter, chapter.title, chapter.summary);
      if (chapter.newWorldFacts) {
        chapter.newWorldFacts.forEach(f => bible.addWorldFact(f.fact, f.category, f.importance));
      }

      setStoryBible(bible);
      setChapterData(chapter);
      setChoiceMade(false);
    } catch (error) {
      console.error('Error generating chapter:', error);
    }

    setLoading(false);
  };

  // Save story
  const saveStory = () => {
    if (!storyBible || !chapterData) return;
    storage.saveStory(storyBible.storyId, {
      bible: storyBible,
      currentChapter: chapterData,
      lastPlayed: new Date().toISOString()
    });
    setSavedStories(storage.listStories());
    alert('✓ Story saved!');
  };

  // Load story from storage
  const loadStory = (id) => {
    const data = storage.loadStory(id);
    if (data) {
      // Reconstruct StoryBible from saved data
      const loadedBible = new StoryBible(
        data.bible.title,
        data.bible.genre,
        data.bible.logline,
        data.bible.tone
      );
      // Copy all properties from saved bible
      Object.assign(loadedBible, data.bible);
      
      setStoryBible(loadedBible);
      setChapterData(data.currentChapter);
      setChoiceMade(false);
      setScreen('reading');
    }
  };

  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-serif">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-rose-950/20 via-gray-950 to-amber-950/10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl" />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 italic">{loadingText}</p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-gray-950/95 flex items-center justify-center p-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" /> Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Primary AI Provider</label>
                <select
                  value={primaryProvider}
                  onChange={(e) => setPrimaryProvider(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
                >
                  <option value="openai">OpenAI GPT-4.1</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
                />
              </div>

              <div className="opacity-50">
                <label className="block text-sm text-gray-400 mb-1">
                  Image Generation API Key
                  <span className="ml-2 text-xs text-gray-600">(Coming Soon)</span>
                </label>
                <input
                  type="password"
                  disabled
                  placeholder="For book covers & character portraits"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>

              <button
                onClick={saveSettings}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold rounded"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDING SCREEN */}
      {screen === 'landing' && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
          {/* Logo */}
          <img
            src="/images/logos/loomiverse-logo.png"
            alt="Loomiverse"
            className="w-28 h-28 mb-4 object-contain"
          />
          <h1 className="text-6xl md:text-7xl font-bold mb-2 bg-gradient-to-r from-gray-100 via-amber-400 to-gray-100 bg-clip-text text-transparent">
            Loomiverse
          </h1>
          <p className="text-xl text-gray-400 italic mb-2">Where every choice weaves destiny</p>
          <p className="text-xs text-gray-600 mb-8">Unified Story Engine • v4.0</p>

          {/* Main Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => setScreen('characters')}
              className="px-8 py-4 border-2 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-gray-950 transition-all flex items-center gap-2"
            >
              <User className="w-5 h-5" /> Characters
            </button>
            <button
              onClick={() => setScreen('genre')}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-gray-950 font-bold hover:from-amber-500 hover:to-amber-400 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" /> New Story
            </button>
            {savedStories.length > 0 && (
              <button
                onClick={() => setScreen('stories')}
                className="px-8 py-4 border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-gray-950 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> My Stories
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 text-center mb-8">
            <button onClick={() => setScreen('characters')} className="hover:opacity-80 transition-opacity">
              <div className="text-3xl font-bold text-amber-500">{characters.length}</div>
              <div className="text-xs text-gray-500">Characters</div>
            </button>
            <button onClick={() => savedStories.length > 0 && setScreen('stories')} className="hover:opacity-80 transition-opacity">
              <div className="text-3xl font-bold text-amber-500">{savedStories.length}</div>
              <div className="text-xs text-gray-500">Stories</div>
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-500 hover:text-amber-500 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      )}

      {/* CHARACTERS SCREEN */}
      {screen === 'characters' && (
        <div className="relative z-10 min-h-screen p-8">
          <button onClick={() => setScreen('landing')} className="mb-6 text-gray-500 hover:text-gray-300">
            ← Back
          </button>
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-amber-500" /> Your Characters
            </h2>
            <button
              onClick={generateNewCharacter}
              disabled={generatingCharacter}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold rounded flex items-center gap-2 disabled:opacity-50"
            >
              {generatingCharacter ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate Character
                </>
              )}
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCharacterFilter('all')}
              className={`px-4 py-2 rounded text-sm transition-all ${
                characterFilter === 'all' 
                  ? 'bg-amber-600 text-gray-950 font-bold' 
                  : 'border border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              All ({characters.length})
            </button>
            <button
              onClick={() => setCharacterFilter('user')}
              className={`px-4 py-2 rounded text-sm transition-all ${
                characterFilter === 'user' 
                  ? 'bg-amber-600 text-gray-950 font-bold' 
                  : 'border border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              Created ({characters.filter(c => c.origin === 'user' || !c.origin).length})
            </button>
            <button
              onClick={() => setCharacterFilter('story')}
              className={`px-4 py-2 rounded text-sm transition-all ${
                characterFilter === 'story' 
                  ? 'bg-amber-600 text-gray-950 font-bold' 
                  : 'border border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              From Stories ({characters.filter(c => c.origin === 'story').length})
            </button>
          </div>

          {(() => {
            const filteredCharacters = characterFilter === 'all' 
              ? characters 
              : characterFilter === 'user'
                ? characters.filter(c => c.origin === 'user' || !c.origin)
                : characters.filter(c => c.origin === 'story');
            
            return filteredCharacters.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {characterFilter === 'all' ? 'No characters yet' : 
                 characterFilter === 'user' ? 'No user-created characters' : 'No characters from stories'}
              </p>
              {characterFilter === 'all' && (
                <button
                  onClick={generateNewCharacter}
                  className="px-6 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-gray-950 rounded"
                >
                  Generate Your First Character
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 max-w-4xl">
              {filteredCharacters.map(char => (
                <div
                  key={char.id}
                  className={`p-6 border rounded-lg cursor-pointer transition-all ${
                    selectedCharacter?.id === char.id 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                  }`}
                  onClick={() => setSelectedCharacter(selectedCharacter?.id === char.id ? null : char)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {char.name || 'Unnamed'}
                        {char.role && <span className="text-sm font-normal text-amber-500/70">({char.role})</span>}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {char.cultural_identity?.ethnicity} • {char.biology?.sex === 'M' ? 'Male' : 'Female'} • 
                        Born {char.world?.birth_year}
                      </p>
                      {char.origin === 'story' && char.originStoryTitle && (
                        <p className="text-xs text-blue-400 mt-1">
                          From: {char.originStoryTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 text-xs rounded ${
                        char.simulated ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {char.simulated ? 'Simulated' : 'Seed Only'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        char.origin === 'story' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'
                      }`}>
                        {char.origin === 'story' ? 'Story' : 'Created'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Attachment:</span>
                      <span className={`ml-1 ${
                        char.attachment?.attachment_style === 'secure' ? 'text-green-400' :
                        char.attachment?.attachment_style === 'disorganized' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {char.attachment?.attachment_style}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Climate:</span>
                      <span className="ml-1 text-gray-300">{char.atmospheric_conditions?.emotional_climate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Threat:</span>
                      <span className="ml-1 text-gray-300">{Math.round(char.atmospheric_conditions?.ambient_threat * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Era:</span>
                      <span className="ml-1 text-gray-300">{char.world?.era}</span>
                    </div>
                  </div>

                  {selectedCharacter?.id === char.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      {/* Detailed view */}
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        {/* Core Beliefs */}
                        <div>
                          <h4 className="text-xs text-amber-500 uppercase tracking-wide mb-2">Core Beliefs</h4>
                          {Object.entries(char.attachment?.core_beliefs || {}).map(([belief, value]) => (
                            <div key={belief} className="flex items-center gap-2 text-sm mb-1">
                              <div className="w-24 truncate text-gray-400">{belief.replace('I am ', '').replace('Others can be ', '').replace('The world is ', '').replace('My ', '').replace(' matter', '')}</div>
                              <div className="flex-1 h-2 bg-gray-800 rounded-full">
                                <div 
                                  className="h-full bg-amber-500 rounded-full" 
                                  style={{ width: `${value * 100}%` }} 
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{Math.round(value * 100)}%</span>
                            </div>
                          ))}
                        </div>

                        {/* Internal Working Models */}
                        <div>
                          <h4 className="text-xs text-amber-500 uppercase tracking-wide mb-2">Internal Models</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Self:</span> <span className="text-gray-300">"{char.attachment?.internal_working_models?.model_of_self}"</span></p>
                            <p><span className="text-gray-500">Others:</span> <span className="text-gray-300">"{char.attachment?.internal_working_models?.model_of_other}"</span></p>
                            <p><span className="text-gray-500">Relationships:</span> <span className="text-gray-300">"{char.attachment?.internal_working_models?.model_of_relationship}"</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Simulation results if available */}
                      {char.simulated && char.simulation_results && (
                        <div className="mb-4">
                          <h4 className="text-xs text-amber-500 uppercase tracking-wide mb-2">Simulation Results</h4>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-amber-500">{char.simulation_results.total_events}</div>
                              <div className="text-xs text-gray-500">Events</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-amber-500">{char.simulation_results.core_memories?.length || 0}</div>
                              <div className="text-xs text-gray-500">Core Memories</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-amber-500">{char.simulation_results.coping_patterns?.length || 0}</div>
                              <div className="text-xs text-gray-500">Coping Patterns</div>
                            </div>
                          </div>
                          
                          {char.simulation_results.core_memories?.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-xs text-gray-500 mb-1">Key Memories:</h5>
                              <div className="space-y-1">
                                {char.simulation_results.core_memories.slice(0, 3).map((m, i) => (
                                  <p key={i} className="text-xs text-gray-400">
                                    Age {m.age}: {m.type} → "{m.meaning}"
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!char.simulated && (
                          <button
                            onClick={(e) => { e.stopPropagation(); simulateChildhood(char); }}
                            disabled={simulatingChildhood}
                            className="px-4 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-gray-950 rounded flex items-center gap-2 text-sm"
                          >
                            <Brain className="w-4 h-4" /> 
                            {simulatingChildhood ? `Simulating... ${Math.round(simulationProgress)}%` : 'Simulate Childhood'}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); startStoryWithCharacter(char); }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-gray-950 rounded flex items-center gap-2 text-sm"
                        >
                          <Play className="w-4 h-4" /> Start Story
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (confirm('Delete this character?')) {
                              storage.deleteCharacter(char.id);
                              setCharacters(storage.getCharacters());
                              setSelectedCharacter(null);
                            }
                          }}
                          className="px-4 py-2 border border-red-800 text-red-400 hover:bg-red-900 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
          })()}
        </div>
      )}

      {/* STORIES SCREEN */}
      {screen === 'stories' && (
        <div className="relative z-10 min-h-screen p-8">
          <button onClick={() => setScreen('landing')} className="mb-6 text-gray-500 hover:text-gray-300 flex items-center gap-2">
            ← Back to Home
          </button>
          
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-500" />
            My Stories
          </h2>
          <p className="text-gray-500 mb-8">Continue your adventures or start fresh</p>
          
          {savedStories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">No stories yet. Start your first adventure!</p>
              <button
                onClick={() => setScreen('genre')}
                className="px-6 py-3 border border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-gray-950 transition-all"
              >
                Begin New Story
              </button>
            </div>
          ) : (
            <div className="grid gap-6 max-w-4xl">
              {savedStories.map(story => {
                // Generate or use existing gradient
                const gradients = [
                  'from-rose-600 to-purple-700',
                  'from-amber-600 to-red-700',
                  'from-emerald-600 to-cyan-700',
                  'from-blue-600 to-indigo-700',
                  'from-pink-600 to-rose-700',
                  'from-violet-600 to-purple-700',
                  'from-teal-600 to-emerald-700',
                  'from-orange-600 to-amber-700'
                ];
                const gradientIndex = story.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
                const gradient = story.coverGradient || gradients[gradientIndex];
                
                return (
                  <div 
                    key={story.id}
                    className="flex gap-6 p-4 border border-gray-800 bg-gray-900/50 rounded-lg hover:border-gray-700 transition-all"
                  >
                    {/* Book Cover Placeholder */}
                    <div className={`w-32 h-44 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 flex flex-col justify-end p-3 shadow-lg`}>
                      <h4 className="text-white font-bold text-sm leading-tight drop-shadow-lg">
                        {story.title}
                      </h4>
                      <p className="text-white/70 text-xs mt-1">{story.genre}</p>
                    </div>
                    
                    {/* Story Details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1">{story.title}</h3>
                        <p className="text-amber-500 text-sm mb-2">{story.genre}</p>
                        
                        {story.protagonistName && (
                          <p className="text-gray-400 text-sm mb-2">
                            <span className="text-gray-500">Protagonist:</span> {story.protagonistName}
                          </p>
                        )}
                        
                        {story.logline && (
                          <p className="text-gray-500 text-sm italic line-clamp-2 mb-3">
                            {story.logline}
                          </p>
                        )}
                        
                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 transition-all"
                              style={{ width: `${(story.progress / story.totalChapters) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-sm">
                            Ch {story.progress}/{story.totalChapters}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-xs">
                          Last played: {new Date(story.lastPlayed).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => loadStory(story.id)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-gray-950 font-bold rounded text-sm"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${story.title}"? This cannot be undone.`)) {
                              storage.deleteStory(story.id);
                              setSavedStories(storage.listStories());
                            }
                          }}
                          className="px-4 py-2 border border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Start New Story Button */}
          {savedStories.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setScreen('genre')}
                className="px-6 py-3 border border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-gray-950 transition-all"
              >
                Begin New Story
              </button>
            </div>
          )}
        </div>
      )}

      {/* GENRE SELECTION */}
      {screen === 'genre' && (
        <div className="relative z-10 min-h-screen flex flex-col items-center p-8 overflow-y-auto">
          <button onClick={() => setScreen('landing')} className="absolute top-6 left-6 text-gray-500 hover:text-gray-300 z-20">
            ← Back
          </button>

          {selectedCharacter && (
            <div className="mb-6 text-center pt-12">
              <p className="text-gray-500 text-sm">Playing as:</p>
              <p className="text-amber-400 font-bold">{selectedCharacter.name}</p>
            </div>
          )}

          <h2 className="text-3xl font-bold mb-2 pt-8">Choose Your World</h2>
          <p className="text-gray-500 mb-8 text-center">26 genres, each with unique story formulas and author styles</p>

          {/* Genre Categories */}
          <div className="w-full max-w-5xl space-y-8">
            {/* Fantasy & Sci-Fi */}
            <div>
              <h3 className="text-xs text-amber-500 uppercase tracking-widest mb-3 font-bold">Speculative Fiction</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['fantasy', 'darkFantasy', 'scifi', 'cyberpunk', 'retroScifi', 'dystopian', 'paranormal', 'magicRealism'].map(key => {
                  const genre = genres[key];
                  if (!genre) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => selectGenre(key)}
                      className="p-4 border border-gray-800 hover:border-amber-500/50 bg-gray-900/50 hover:bg-amber-500/5 transition-all text-center rounded"
                    >
                      <span className="text-2xl block mb-2">{genre.icon}</span>
                      <h4 className="font-bold text-sm">{genre.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mystery & Thriller */}
            <div>
              <h3 className="text-xs text-amber-500 uppercase tracking-widest mb-3 font-bold">Mystery & Suspense</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['mystery', 'thriller', 'noir', 'crime', 'horror', 'gothic'].map(key => {
                  const genre = genres[key];
                  if (!genre) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => selectGenre(key)}
                      className="p-4 border border-gray-800 hover:border-amber-500/50 bg-gray-900/50 hover:bg-amber-500/5 transition-all text-center rounded"
                    >
                      <span className="text-2xl block mb-2">{genre.icon}</span>
                      <h4 className="font-bold text-sm">{genre.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Romance & Drama */}
            <div>
              <h3 className="text-xs text-amber-500 uppercase tracking-widest mb-3 font-bold">Romance & Drama</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['romance', 'romcom', 'literary', 'youngAdult', 'historical', 'biography'].map(key => {
                  const genre = genres[key];
                  if (!genre) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => selectGenre(key)}
                      className="p-4 border border-gray-800 hover:border-amber-500/50 bg-gray-900/50 hover:bg-amber-500/5 transition-all text-center rounded"
                    >
                      <span className="text-2xl block mb-2">{genre.icon}</span>
                      <h4 className="font-bold text-sm">{genre.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action & Adventure */}
            <div>
              <h3 className="text-xs text-amber-500 uppercase tracking-widest mb-3 font-bold">Action & Adventure</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['adventure', 'action', 'western'].map(key => {
                  const genre = genres[key];
                  if (!genre) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => selectGenre(key)}
                      className="p-4 border border-gray-800 hover:border-amber-500/50 bg-gray-900/50 hover:bg-amber-500/5 transition-all text-center rounded"
                    >
                      <span className="text-2xl block mb-2">{genre.icon}</span>
                      <h4 className="font-bold text-sm">{genre.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unique & Experimental */}
            <div className="pb-8">
              <h3 className="text-xs text-amber-500 uppercase tracking-widest mb-3 font-bold">Unique & Experimental</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['satire', 'standup', 'graphicNovel'].map(key => {
                  const genre = genres[key];
                  if (!genre) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => selectGenre(key)}
                      className="p-4 border border-gray-800 hover:border-amber-500/50 bg-gray-900/50 hover:bg-amber-500/5 transition-all text-center rounded"
                    >
                      <span className="text-2xl block mb-2">{genre.icon}</span>
                      <h4 className="font-bold text-sm">{genre.name}</h4>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORY SETUP */}
      {screen === 'setup' && currentStory && storyBible && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
          <button onClick={() => setScreen('genre')} className="absolute top-6 left-6 text-gray-500 hover:text-gray-300">
            ← Back
          </button>
          
          <div className="text-center max-w-3xl w-full">
            <div className="text-amber-500 text-sm tracking-widest uppercase mb-4">
              {genres[selectedGenre]?.icon} {genres[selectedGenre]?.name}
            </div>
            
            <h2 className="text-3xl font-bold mb-6">Your Story Awaits</h2>
            
            {/* Story Info */}
            <div className="mb-6 p-6 border border-gray-800 bg-gray-900/50 rounded-lg">
              <h3 className="text-2xl font-bold mb-3">{currentStory.title}</h3>
              <p className="text-gray-400 italic">{currentStory.logline}</p>
            </div>
            
            {/* Regenerate Button */}
            <button
              onClick={() => selectGenre(selectedGenre)}
              className="mb-8 px-4 py-2 text-sm text-gray-400 border border-gray-700 hover:border-amber-500/50 hover:text-amber-400 rounded transition-all"
            >
              ↻ Generate Different Story
            </button>
            
            {/* Cast Section */}
            <div className="mb-8">
              <h4 className="text-xs text-amber-500 uppercase tracking-widest mb-4">Your Cast</h4>
              
              <div className="grid gap-3 text-left">
                {/* Protagonist */}
                {storyBible.protagonist && (
                  <div className="p-4 border border-amber-500/50 bg-amber-500/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-amber-400 font-bold text-lg">{storyBible.protagonist.name}</span>
                        <span className="text-gray-500 text-sm ml-2">— Protagonist</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        storyBible.protagonist.attachment?.attachment_style === 'secure' ? 'bg-green-900/50 text-green-400' :
                        storyBible.protagonist.attachment?.attachment_style === 'disorganized' ? 'bg-red-900/50 text-red-400' : 
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {storyBible.protagonist.attachment?.attachment_style}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{storyBible.protagonist.cultural_identity?.ethnicity}</span>
                      <span>{storyBible.protagonist.biology?.sex === 'M' ? 'Male' : 'Female'}</span>
                      <span>Climate: {storyBible.protagonist.atmospheric_conditions?.emotional_climate}</span>
                    </div>
                    {storyBible.protagonist.attachment?.internal_working_models && (
                      <div className="mt-2 text-xs text-gray-600 italic">
                        "{storyBible.protagonist.attachment.internal_working_models.model_of_self}" • 
                        Sees others as "{storyBible.protagonist.attachment.internal_working_models.model_of_other}"
                      </div>
                    )}
                  </div>
                )}
                
                {/* Supporting NPCs */}
                {Object.entries(storyBible.characters).filter(([_, c]) => c.role !== 'Protagonist').map(([name, char]) => (
                  <div key={name} className="p-3 border border-gray-800 bg-gray-900/30 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-gray-200 font-medium">{name}</span>
                      <span className="text-gray-500 text-sm ml-2">— {char.role}</span>
                    </div>
                    {char.psychology && (
                      <span className="text-xs text-gray-600">
                        {char.psychology.attachment_style} • {char.psychology.emotional_climate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={beginStory}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-gray-950 font-bold hover:from-amber-500 hover:to-amber-400 transition-all rounded"
            >
              Begin Chapter One →
            </button>
          </div>
        </div>
      )}

      {/* READING SCREEN */}
      {screen === 'reading' && chapterData && storyBible && (
        <div className="relative z-10 min-h-screen">
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-gray-950 to-transparent">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <span className="text-amber-500 text-sm tracking-widest">
                Chapter {romans[storyBible.currentChapter - 1] || storyBible.currentChapter}
              </span>
              <div className="flex items-center gap-4">
                <button onClick={saveStory} className="p-2 hover:bg-gray-800 rounded" title="Save">
                  <Save className="w-4 h-4 text-gray-500 hover:text-amber-500" />
                </button>
                <div className="w-32 h-1 bg-gray-800 rounded">
                  <div 
                    className="h-full bg-amber-500 rounded transition-all" 
                    style={{ width: `${(storyBible.currentChapter / storyBible.totalChapters) * 100}%` }} 
                  />
                </div>
                <span className="text-gray-500 text-xs">
                  {storyBible.currentChapter}/{storyBible.totalChapters}
                </span>
              </div>
            </div>
          </header>

          {/* Generated by indicator */}
          {chapterData._generatedBy && (
            <div className="fixed top-16 left-6 z-30 text-xs text-gray-600">
              via {chapterData._generatedBy === 'demo' ? 'demo' : AI_PROVIDERS[chapterData._generatedBy]?.name}
            </div>
          )}

          {/* Content */}
          <article className="max-w-2xl mx-auto px-6 pt-28 pb-24">
            <h2 className="text-4xl font-bold text-center mb-8">{chapterData.title}</h2>
            
            <div className="prose prose-invert prose-lg max-w-none">
              {chapterData.content.split('\n\n').map((para, i) => (
                <p key={i} className="mb-6 text-gray-300 leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:text-amber-500 first-letter:float-left first-letter:mr-2">
                  {para}
                </p>
              ))}
            </div>

            {/* Choices */}
            {!choiceMade && chapterData.choices && (
              <div className="mt-12 pt-8 border-t border-gray-800">
                <p className="text-center text-amber-500 font-bold mb-6">What happens next?</p>
                <div className="space-y-3">
                  {chapterData.choices.map((choice, i) => (
                    <button
                      key={choice.id}
                      onClick={() => makeChoice(choice.id, choice.text)}
                      className="w-full text-left p-4 border border-gray-800 hover:border-rose-600/50 hover:bg-rose-600/5 transition-all"
                    >
                      <span className="text-amber-500 font-bold mr-3">{String.fromCharCode(65 + i)}</span>
                      {choice.text}
                      {choice.hint && (
                        <span className="block text-sm text-gray-500 mt-1 ml-6 italic">{choice.hint}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            {choiceMade && (
              <div className="mt-12 text-center">
                <button
                  onClick={nextChapter}
                  className="px-8 py-3 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-gray-950 transition-all tracking-wide"
                >
                  Continue to Next Chapter →
                </button>
              </div>
            )}
          </article>

          {/* Story Bible Toggle */}
          <button
            onClick={() => setShowBible(!showBible)}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full border border-gray-700 bg-gray-900 hover:border-amber-500 text-2xl flex items-center justify-center transition-all"
            title="Story Bible"
          >
            📜
          </button>

          {/* Story Bible Panel - Enhanced */}
          {showBible && (
            <aside className="fixed top-0 right-0 h-full w-96 bg-gray-950 border-l border-gray-800 z-50 overflow-y-auto">
              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-800">
                  <div>
                    <h3 className="text-amber-500 font-bold text-lg">Story Bible</h3>
                    <p className="text-xs text-gray-600">{storyBible.title}</p>
                  </div>
                  <button onClick={() => setShowBible(false)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
                </div>

                {/* Chapters Section */}
                <div className="mb-6">
                  <h4 className="text-xs tracking-widest text-amber-500/70 uppercase mb-3 flex items-center gap-2">
                    <span>📖</span> Chapters
                  </h4>
                  <div className="space-y-1">
                    {storyBible.chapterSummaries.length === 0 ? (
                      <p className="text-sm text-gray-600 italic">Story not yet begun...</p>
                    ) : (
                      storyBible.chapterSummaries.map((ch, i) => (
                        <div 
                          key={i} 
                          className={`p-2 rounded text-sm ${
                            ch.number === storyBible.currentChapter 
                              ? 'bg-amber-500/10 border border-amber-500/30' 
                              : 'hover:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              ch.number === storyBible.currentChapter 
                                ? 'bg-amber-500 text-gray-950' 
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {ch.number}
                            </span>
                            <span className={ch.number === storyBible.currentChapter ? 'text-amber-400' : 'text-gray-400'}>
                              {ch.title}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Protagonist Section */}
                {storyBible.protagonist && (
                  <div className="mb-6">
                    <h4 className="text-xs tracking-widest text-amber-500/70 uppercase mb-3 flex items-center gap-2">
                      <span>⭐</span> Protagonist
                    </h4>
                    <div 
                      className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors"
                      onClick={() => setExpandedCharacter(expandedCharacter === 'protagonist' ? null : 'protagonist')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-400 font-bold">{storyBible.protagonist.name}</span>
                        <span className="text-xs text-gray-500">{expandedCharacter === 'protagonist' ? '▼' : '▶'}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded ${
                          storyBible.protagonist.attachment?.attachment_style === 'secure' ? 'bg-green-900/50 text-green-400' :
                          storyBible.protagonist.attachment?.attachment_style === 'disorganized' ? 'bg-red-900/50 text-red-400' : 
                          'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {storyBible.protagonist.attachment?.attachment_style}
                        </span>
                        <span className="text-gray-600">{storyBible.protagonist.cultural_identity?.ethnicity}</span>
                      </div>
                      
                      {/* Expanded Profile */}
                      {expandedCharacter === 'protagonist' && (
                        <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-3">
                          {/* Internal Models */}
                          {storyBible.protagonist.attachment?.internal_working_models && (
                            <div>
                              <div className="text-xs text-amber-500/70 uppercase mb-1">Internal Models</div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>Self: <span className="text-gray-300">"{storyBible.protagonist.attachment.internal_working_models.model_of_self}"</span></div>
                                <div>Others: <span className="text-gray-300">"{storyBible.protagonist.attachment.internal_working_models.model_of_other}"</span></div>
                                <div>Relationships: <span className="text-gray-300">"{storyBible.protagonist.attachment.internal_working_models.model_of_relationship}"</span></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Core Beliefs */}
                          {storyBible.protagonist.attachment?.core_beliefs && (
                            <div>
                              <div className="text-xs text-amber-500/70 uppercase mb-1">Core Beliefs</div>
                              <div className="space-y-1">
                                {Object.entries(storyBible.protagonist.attachment.core_beliefs).map(([belief, value]) => (
                                  <div key={belief} className="flex items-center gap-2 text-xs">
                                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${value > 0.6 ? 'bg-green-500' : value > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${value * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-gray-500 truncate" title={belief}>
                                      {belief.replace('I am ', '').replace('Others can be ', '').replace('The world is ', '').replace('My ', '').replace('I can ', '')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Atmospheric Background */}
                          {storyBible.protagonist.atmospheric_conditions && (
                            <div>
                              <div className="text-xs text-amber-500/70 uppercase mb-1">Background</div>
                              <div className="text-xs text-gray-400">
                                <span>Grew up in a <span className="text-gray-300">{storyBible.protagonist.atmospheric_conditions.emotional_climate}</span> environment</span>
                                {storyBible.protagonist.atmospheric_conditions.threat_source && (
                                  <span> with <span className="text-red-400/70">{storyBible.protagonist.atmospheric_conditions.threat_source}</span></span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supporting Cast */}
                <div className="mb-6">
                  <h4 className="text-xs tracking-widest text-amber-500/70 uppercase mb-3 flex items-center gap-2">
                    <span>👥</span> Cast ({Object.keys(storyBible.characters).filter(n => n !== storyBible.protagonist?.name).length})
                  </h4>
                  <div className="space-y-2">
                    {Object.values(storyBible.characters)
                      .filter(c => c.name !== storyBible.protagonist?.name && c.status === 'active')
                      .map(c => (
                        <div 
                          key={c.name} 
                          className="p-2 border border-gray-800 rounded cursor-pointer hover:border-gray-700 transition-colors"
                          onClick={() => setExpandedCharacter(expandedCharacter === c.name ? null : c.name)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-200 font-medium text-sm">{c.name}</span>
                              <span className="text-gray-600 text-xs ml-2">— {c.role}</span>
                            </div>
                            <span className="text-xs text-gray-600">{expandedCharacter === c.name ? '▼' : '▶'}</span>
                          </div>
                          
                          {c.traits?.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">{c.traits.join(', ')}</div>
                          )}
                          
                          {/* Expanded NPC Profile */}
                          {expandedCharacter === c.name && c.psychology && (
                            <div className="mt-3 pt-2 border-t border-gray-800 text-xs space-y-2">
                              <div className="flex gap-2">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  c.psychology.attachment_style === 'secure' ? 'bg-green-900/50 text-green-400' :
                                  c.psychology.attachment_style === 'disorganized' ? 'bg-red-900/50 text-red-400' : 
                                  'bg-yellow-900/50 text-yellow-400'
                                }`}>
                                  {c.psychology.attachment_style}
                                </span>
                                {c.psychology.emotional_climate && (
                                  <span className="text-gray-500">{c.psychology.emotional_climate} upbringing</span>
                                )}
                              </div>
                              {c.psychology.cultural_identity && (
                                <div className="text-gray-500">{c.psychology.cultural_identity}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    {Object.values(storyBible.characters).filter(c => c.name !== storyBible.protagonist?.name).length === 0 && (
                      <p className="text-sm text-gray-600 italic">Characters will appear as the story unfolds...</p>
                    )}
                  </div>
                </div>

                {/* World Facts */}
                <div className="mb-6">
                  <h4 className="text-xs tracking-widest text-amber-500/70 uppercase mb-3 flex items-center gap-2">
                    <span>🌍</span> World Facts
                  </h4>
                  {storyBible.worldFacts.filter(f => f.importance === 'critical').length === 0 ? (
                    <p className="text-sm text-gray-600 italic">World details will emerge...</p>
                  ) : (
                    <div className="space-y-2">
                      {storyBible.worldFacts.filter(f => f.importance === 'critical').map((f, i) => (
                        <div key={i} className="text-sm text-gray-400 p-2 bg-gray-900/50 rounded">
                          <span className="text-rose-500 text-xs uppercase tracking-wide">{f.category}</span>
                          <p className="mt-1">{f.fact}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Your Choices */}
                <div>
                  <h4 className="text-xs tracking-widest text-amber-500/70 uppercase mb-3 flex items-center gap-2">
                    <span>🎭</span> Your Choices
                  </h4>
                  {storyBible.choiceHistory.length === 0 ? (
                    <p className="text-sm text-gray-600 italic">Your decisions shape the story...</p>
                  ) : (
                    <div className="space-y-2">
                      {storyBible.choiceHistory.map((c, i) => (
                        <div key={i} className="text-sm text-gray-400 pl-3 border-l-2 border-rose-600">
                          <span className="text-amber-500 text-xs font-medium">Ch. {c.chapter}</span>
                          <p className="mt-0.5">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
