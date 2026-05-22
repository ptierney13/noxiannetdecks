export type ConditionBlock = { kind: 'condition'; label: string };
export type UnknownBlock = { kind: 'unknown'; raw: string };
export type QueryBlock = ConditionBlock | UnknownBlock;
// Flat list interleaved with connectors: block | 'AND' | 'OR'
export type ParsedQueryItem = QueryBlock | 'AND' | 'OR';

// ---------------------------------------------------------------------------
// Field alias → canonical key
// ---------------------------------------------------------------------------

const FIELD_ALIAS_MAP: Record<string, string> = {
  name: 'name', n: 'name', clean_name: 'name',
  text: 'text', o: 'text', r: 'text',
  t: 'typeline', type: 'typeline', typeline: 'typeline',
  cardtype: 'cardtype', ct: 'cardtype',
  supertype: 'supertype', u: 'supertype',
  domain: 'domain', d: 'domain',
  tag: 'tag', g: 'tag',
  keyword: 'keyword', k: 'keyword', kw: 'keyword',
  rarity: 'rarity',
  set: 'set', s: 'set',
  artist: 'artist', a: 'artist',
  number: 'number', cn: 'number',
  is: 'is',
  finish: 'finish', variant: 'finish',
  cost: 'cost', c: 'cost',
  energy: 'energy', e: 'energy',
  might: 'might', m: 'might',
  power: 'power', p: 'power',
  price: 'price',
  layout: 'layout', orientation: 'layout',
  language: 'language',
  flavour: 'flavour', ft: 'flavour', flavor: 'flavour',
  id: 'id', riftbound_id: 'id', tcgplayer_id: 'id',
};

// ---------------------------------------------------------------------------
// Domain value → display name
// ---------------------------------------------------------------------------

const DOMAIN_NAME_MAP: Record<string, string> = {
  m: 'Mind', u: 'Mind', mind: 'Mind', blue: 'Mind', blu: 'Mind',
  f: 'Fury', r: 'Fury', fury: 'Fury', red: 'Fury',
  c: 'Calm', g: 'Calm', calm: 'Calm', green: 'Calm', gree: 'Calm',
  b: 'Body', o: 'Body', body: 'Body', orange: 'Body', oran: 'Body',
  h: 'Chaos', p: 'Chaos', chaos: 'Chaos', purple: 'Chaos', purp: 'Chaos',
  y: 'Order', order: 'Order', yellow: 'Order', yell: 'Order',
};

// Single-character domain letter codes (primary + color aliases)
const DOMAIN_SINGLE_CHARS = new Set(['m', 'f', 'c', 'b', 'h', 'y', 'u', 'r', 'g', 'o', 'p']);

function parseDomainValue(value: string): string[] {
  const lower = value.toLowerCase();
  const exact = DOMAIN_NAME_MAP[lower];
  if (exact !== undefined) return [exact];
  // Multi-char code like "mf" or "cb" — each char is a single-char domain code
  if (value.length > 1 && [...lower].every(ch => DOMAIN_SINGLE_CHARS.has(ch))) {
    return [...lower].map(ch => DOMAIN_NAME_MAP[ch] ?? ch.toUpperCase());
  }
  return [capitalize(value)];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

function fmtOp(op: string): string {
  if (op === '>=') return '≥';
  if (op === '<=') return '≤';
  return op;
}

// ---------------------------------------------------------------------------
// Label builder — converts a group of same-field conditions to a string
// ---------------------------------------------------------------------------

type Condition = { op: string; value: string; negated: boolean };

function buildLabel(
  canonicalField: string | null,
  conditions: Condition[],
  intraConnector: 'AND' | 'OR',
): string {
  const allNegated = conditions.every(c => c.negated);
  const notPrefix = allNegated ? 'NOT ' : '';
  const conn = ` ${intraConnector} `;

  // Bare text search
  if (canonicalField === null) {
    const joined = conditions.map(c => `"${c.value}"`).join(conn);
    return `${notPrefix}${joined} anywhere on the card`;
  }

  switch (canonicalField) {
    case 'name': {
      const opStr = conditions[0]!.op === '=' ? 'is' : 'contains';
      return `${notPrefix}Name ${opStr} ${conditions.map(c => `"${c.value}"`).join(conn)}`;
    }
    case 'text':
      return `${notPrefix}Rules text contains ${conditions.map(c => `"${c.value}"`).join(conn)}`;
    case 'typeline':
      return `${notPrefix}Type line includes ${conditions.map(c => capitalize(c.value)).join(conn)}`;
    case 'cardtype':
      return `${notPrefix}Card type is ${conditions.map(c => capitalize(c.value)).join(conn)}`;
    case 'supertype':
      return `${notPrefix}Supertype is ${conditions.map(c => capitalize(c.value)).join(conn)}`;
    case 'domain': {
      const op0 = conditions[0]!.op;
      const isSetCompare = op0 === '>' || op0 === '>=' || op0 === '<' || op0 === '<=';
      if (isSetCompare) {
        const parts = conditions
          .map(c => `${fmtOp(c.op)} ${parseDomainValue(c.value).join(' AND ')}`)
          .join(conn);
        return `${notPrefix}Domain ${parts}`;
      }
      const names = conditions.flatMap(c => parseDomainValue(c.value)).join(conn);
      return `${notPrefix}Domain is ${names}`;
    }
    case 'tag':
      return `${notPrefix}Tags contain ${conditions.map(c => c.value).join(conn)}`;
    case 'keyword':
      return `${notPrefix}Keyword is ${conditions.map(c => capitalize(c.value)).join(conn)}`;
    case 'rarity':
      return `${notPrefix}Rarity is ${conditions.map(c => capitalize(c.value)).join(conn)}`;
    case 'set':
      return `${notPrefix}Set is ${conditions.map(c => `"${c.value}"`).join(conn)}`;
    case 'artist':
      return `${notPrefix}Artist is ${conditions.map(c => `"${c.value}"`).join(conn)}`;
    case 'number':
      return `${notPrefix}Collector # ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'is':
      return `${notPrefix}Card is ${conditions.map(c => c.value).join(conn)}`;
    case 'finish':
      return `${notPrefix}Finish is ${conditions.map(c => c.value).join(conn)}`;
    case 'cost':
      return `${notPrefix}Cost ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'energy':
      return `${notPrefix}Energy ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'might':
      return `${notPrefix}Might ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'power':
      return `${notPrefix}Power ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'price':
      return `${notPrefix}Price ${conditions.map(c => `${fmtOp(c.op)} ${c.value}`).join(conn)}`;
    case 'layout':
      return `${notPrefix}Layout is ${conditions.map(c => c.value).join(conn)}`;
    case 'language':
      return `${notPrefix}Language is ${conditions.map(c => c.value).join(conn)}`;
    case 'flavour':
      return `${notPrefix}Flavor text contains ${conditions.map(c => `"${c.value}"`).join(conn)}`;
    case 'id':
      return `${notPrefix}Card ID is ${conditions.map(c => c.value).join(conn)}`;
    default:
      return `${notPrefix}${canonicalField}: ${conditions.map(c => c.value).join(conn)}`;
  }
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TermToken = {
  kind: 'term';
  canonicalField: string | null;
  rawToken: string;
  op: string;
  value: string;
  negated: boolean;
  isUnknown: boolean;
};

type ConnectorToken = { kind: 'connector'; value: 'AND' | 'OR' };
type ParsedToken = TermToken | ConnectorToken;

// Matches optional negation + field + operator + value (quoted or bare)
const FIELD_TERM_RE = /^(-?)([\w_]+)([:=]|>=?|<=?)("(?:[^"\\]|\\.)*"|.+)$/;

function splitIntoRawTokens(query: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;

  for (const ch of query) {
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (inQuote) {
      current += ch;
    } else if (ch === '(' || ch === ')') {
      // Strip parentheses — flatten groups for display purposes
      if (current.length > 0) { tokens.push(current); current = ''; }
    } else if (ch === ' ' || ch === '\t' || ch === '\n') {
      if (current.length > 0) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function classifyToken(raw: string, pendingNeg: boolean): ParsedToken | 'negation' {
  const lower = raw.toLowerCase();
  if (lower === 'or') return { kind: 'connector', value: 'OR' };
  if (lower === 'and') return { kind: 'connector', value: 'AND' };
  if (lower === 'not') return 'negation';

  const m = raw.match(FIELD_TERM_RE);
  if (m) {
    const [, neg, field, op, value] = m;
    const fieldKey = field!.toLowerCase();
    const canonical = FIELD_ALIAS_MAP[fieldKey];
    return {
      kind: 'term',
      canonicalField: canonical ?? null,
      rawToken: raw,
      op: op!,
      value: value!.replace(/^"|"$/g, ''),
      negated: neg === '-' || pendingNeg,
      isUnknown: canonical === undefined,
    };
  }

  // Bare text (no field:op:value structure)
  const isNeg = raw.startsWith('-') && raw.length > 1;
  return {
    kind: 'term',
    canonicalField: null,
    rawToken: raw,
    op: ':',
    value: (isNeg ? raw.slice(1) : raw).replace(/^"|"$/g, ''),
    negated: isNeg || pendingNeg,
    isUnknown: false,
  };
}

// ---------------------------------------------------------------------------
// Grouper — merges adjacent same-canonical-field terms into one block
// ---------------------------------------------------------------------------

type ConditionGroup = {
  canonicalField: string | null;
  rawToken: string;
  conditions: Condition[];
  intraConnector: 'AND' | 'OR';
  isUnknown: boolean;
};

type GroupEntry = { group: ConditionGroup; followingConnector: 'AND' | 'OR' };

function buildGroups(tokens: ParsedToken[]): GroupEntry[] {
  // Build segments: each term plus the connector that immediately follows it
  type Segment = { term: TermToken; followingConnector: 'AND' | 'OR' };
  const segments: Segment[] = [];
  let nextConn: 'AND' | 'OR' = 'AND';

  for (const tok of tokens) {
    if (tok.kind === 'connector') {
      nextConn = tok.value;
      continue;
    }
    if (segments.length > 0) {
      // Assign the pending connector as the following connector of the previous segment
      segments[segments.length - 1]!.followingConnector = nextConn;
    }
    segments.push({ term: tok, followingConnector: 'AND' });
    nextConn = 'AND';
  }

  // Merge adjacent same-canonical-field segments into groups
  const groups: GroupEntry[] = [];
  let i = 0;

  while (i < segments.length) {
    const seg = segments[i]!;
    const group: ConditionGroup = {
      canonicalField: seg.term.canonicalField,
      rawToken: seg.term.rawToken,
      conditions: [{ op: seg.term.op, value: seg.term.value, negated: seg.term.negated }],
      intraConnector: 'AND',
      isUnknown: seg.term.isUnknown,
    };

    if (!seg.term.isUnknown) {
      let j = i;
      while (j + 1 < segments.length) {
        const next = segments[j + 1]!;
        if (!next.term.isUnknown && next.term.canonicalField === group.canonicalField) {
          group.intraConnector = segments[j]!.followingConnector;
          group.conditions.push({ op: next.term.op, value: next.term.value, negated: next.term.negated });
          j++;
        } else {
          break;
        }
      }
      groups.push({ group, followingConnector: segments[j]!.followingConnector });
      i = j + 1;
    } else {
      // Unknown fields are never merged — each is its own block
      groups.push({ group, followingConnector: seg.followingConnector });
      i++;
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function parseQueryToBlocks(rawQuery: string): ParsedQueryItem[] {
  const query = rawQuery.replace(/\bunique:\S+/g, '').trim();
  if (!query) return [];

  const rawTokens = splitIntoRawTokens(query);
  const parsed: ParsedToken[] = [];
  let pendingNeg = false;

  for (const raw of rawTokens) {
    const result = classifyToken(raw, pendingNeg);
    if (result === 'negation') {
      pendingNeg = true;
    } else {
      if (result.kind === 'term') pendingNeg = false;
      parsed.push(result);
    }
  }

  const groups = buildGroups(parsed);
  if (groups.length === 0) return [];

  const items: ParsedQueryItem[] = [];
  groups.forEach(({ group, followingConnector }, idx) => {
    const block: QueryBlock = group.isUnknown
      ? { kind: 'unknown', raw: group.rawToken }
      : { kind: 'condition', label: buildLabel(group.canonicalField, group.conditions, group.intraConnector) };
    items.push(block);
    if (idx < groups.length - 1) {
      items.push(followingConnector);
    }
  });

  return items;
}
