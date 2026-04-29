export const verificationSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://proveit-app.com/schemas/verification-record.schema.json',
  title: 'ProveIT public verification record',
  type: 'object',
  additionalProperties: true,
  required: [
    'id',
    'word_code',
    'file_hash',
    'file_size',
    'mime_type',
    'is_video',
    'verified',
    'verification_status',
    'captured_at',
    'uploaded_at',
    'c2pa',
    'blockchain',
    'verification_checks',
    'trust',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    word_code: { type: 'string', minLength: 5 },
    file_hash: { type: 'string', pattern: '^[0-9a-f]{64}$' },
    file_url: { type: 'string' },
    media_available: { type: 'boolean' },
    file_size: { type: 'number', minimum: 0 },
    mime_type: { type: 'string', minLength: 1 },
    is_video: { type: 'boolean' },
    verified: { type: 'boolean' },
    verification_status: {
      type: 'string',
      enum: ['verified', 'pending', 'failed', 'expired'],
    },
    failure_reason: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
    captured_at: { type: 'string' },
    uploaded_at: { type: 'string' },
    captured_by: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
    author_username: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
    latitude: {
      anyOf: [
        { type: 'number' },
        { type: 'null' },
      ],
    },
    longitude: {
      anyOf: [
        { type: 'number' },
        { type: 'null' },
      ],
    },
    depth_capability: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
    screen_detected: {
      anyOf: [
        { type: 'boolean' },
        { type: 'null' },
      ],
    },
    moire_score: {
      anyOf: [
        { type: 'number' },
        { type: 'null' },
      ],
    },
    moire_detected: {
      anyOf: [
        { type: 'boolean' },
        { type: 'null' },
      ],
    },
    c2pa: {
      type: 'object',
      additionalProperties: true,
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean' },
        claim_generator: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        manifest_hash: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        cert_issuer: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        signed_at: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        ingredients: {},
      },
    },
    blockchain: {
      type: 'object',
      additionalProperties: true,
      required: ['status', 'network', 'on_chain_verified'],
      properties: {
        status: { type: 'string' },
        tx_hash: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        block_number: {
          anyOf: [
            { type: 'number' },
            { type: 'null' },
          ],
        },
        network: { type: 'string' },
        explorer_url: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        registered_at: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        on_chain_verified: {
          anyOf: [
            { type: 'boolean' },
            { type: 'null' },
          ],
        },
      },
    },
    verification_checks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['check', 'passed', 'checked_at'],
        properties: {
          check: { type: 'string' },
          passed: { type: 'boolean' },
          checked_at: { type: 'string' },
        },
      },
    },
    trust: {
      type: 'object',
      additionalProperties: true,
      required: ['level', 'label', 'description', 'equivalent_to_native'],
      properties: {
        level: { type: 'string' },
        label: { type: 'string' },
        description: { type: 'string' },
        equivalent_to_native: { type: 'boolean' },
      },
    },
  },
} as const;
