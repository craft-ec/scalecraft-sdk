/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tribunalcraft.json`.
 */
export type Scalecraft = {
  "address": "YxF3CEwUr5Nhk8FjzZDhKFcSHfgRHYA31Ccm3vd2Mrz",
  "metadata": {
    "name": "scalecraft",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Decentralized arbitration protocol"
  },
  "instructions": [
    {
      "name": "addBondDirect",
      "docs": [
        "Add bond directly from wallet"
      ],
      "discriminator": [
        2,
        240,
        206,
        50,
        106,
        238,
        109,
        254
      ],
      "accounts": [
        {
          "name": "defender",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true
        },
        {
          "name": "defenderRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "defender"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "defenderPool",
          "docs": [
            "Defender's pool - created if doesn't exist"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "defender"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "docs": [
            "Optional: Active dispute (for updating bond_at_risk during dispute)"
          ],
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addBondFromPool",
      "docs": [
        "Add bond from defender pool"
      ],
      "discriminator": [
        127,
        107,
        194,
        189,
        87,
        53,
        213,
        211
      ],
      "accounts": [
        {
          "name": "defender",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "defender"
              }
            ]
          }
        },
        {
          "name": "defenderRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "defender"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "docs": [
            "Optional: Active dispute (for updating bond_at_risk during dispute)"
          ],
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addChallengerStake",
      "docs": [
        "Add stake to challenger pool"
      ],
      "discriminator": [
        240,
        11,
        100,
        179,
        24,
        255,
        67,
        234
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengerPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addJurorStake",
      "docs": [
        "Add stake to juror pool"
      ],
      "discriminator": [
        42,
        194,
        234,
        159,
        186,
        115,
        32,
        169
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addToVote",
      "docs": [
        "Add stake to an existing vote"
      ],
      "discriminator": [
        202,
        66,
        94,
        152,
        90,
        103,
        240,
        68
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        },
        {
          "name": "additionalStake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimChallenger",
      "docs": [
        "Claim challenger reward"
      ],
      "discriminator": [
        148,
        51,
        9,
        223,
        64,
        230,
        123,
        189
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "challenger"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "challengerPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "claimDefender",
      "docs": [
        "Claim defender reward"
      ],
      "discriminator": [
        230,
        104,
        48,
        216,
        165,
        86,
        123,
        142
      ],
      "accounts": [
        {
          "name": "defender",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "defenderRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "defender"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "defender"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "claimJuror",
      "docs": [
        "Claim juror reward"
      ],
      "discriminator": [
        239,
        58,
        13,
        171,
        137,
        109,
        76,
        30
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closeChallengerRecord",
      "docs": [
        "Close challenger record"
      ],
      "discriminator": [
        254,
        255,
        55,
        246,
        51,
        196,
        121,
        232
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "challenger"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closeDefenderRecord",
      "docs": [
        "Close defender record"
      ],
      "discriminator": [
        192,
        4,
        53,
        135,
        80,
        151,
        171,
        87
      ],
      "accounts": [
        {
          "name": "defender",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "defenderRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "defender"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closeJurorRecord",
      "docs": [
        "Close juror record"
      ],
      "discriminator": [
        17,
        237,
        233,
        65,
        255,
        237,
        33,
        58
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "createDefenderPool",
      "docs": [
        "Create a defender pool"
      ],
      "discriminator": [
        146,
        138,
        10,
        14,
        120,
        153,
        97,
        34
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "initialAmount",
          "type": "u64"
        },
        {
          "name": "maxBond",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createDispute",
      "docs": [
        "Create a dispute against a subject"
      ],
      "discriminator": [
        161,
        99,
        53,
        116,
        60,
        79,
        149,
        105
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "challenger"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerPool",
          "docs": [
            "Challenger's pool - created if doesn't exist"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "creatorDefenderPool",
          "docs": [
            "Creator's defender pool - for auto-matching"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "subject.creator",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "creatorDefenderRecord",
          "docs": [
            "Creator's defender record for this round - init_if_needed for pool contribution"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "subject.creator",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "disputeType",
          "type": {
            "defined": {
              "name": "disputeType"
            }
          }
        },
        {
          "name": "detailsCid",
          "type": "string"
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createSubject",
      "docs": [
        "Create a subject with Subject + Dispute + Escrow PDAs",
        "Creator's pool is linked. If initial_bond > 0, transfers from wallet."
      ],
      "discriminator": [
        243,
        24,
        101,
        208,
        170,
        5,
        242,
        26
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "subjectId"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "subjectId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "subjectId"
              }
            ]
          }
        },
        {
          "name": "defenderPool",
          "docs": [
            "Creator's defender pool - created if doesn't exist"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "defenderRecord",
          "docs": [
            "Creator's defender record for round 0"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "subjectId"
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "const",
                "value": [
                  0,
                  0,
                  0,
                  0
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "subjectId",
          "type": "pubkey"
        },
        {
          "name": "detailsCid",
          "type": "string"
        },
        {
          "name": "matchMode",
          "type": "bool"
        },
        {
          "name": "votingPeriod",
          "type": "i64"
        },
        {
          "name": "initialBond",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositDefenderPool",
      "docs": [
        "Deposit to defender pool"
      ],
      "discriminator": [
        91,
        11,
        23,
        235,
        88,
        18,
        65,
        162
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "docs": [
        "Initialize protocol config (one-time setup by deployer)"
      ],
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinChallengers",
      "docs": [
        "Join existing dispute as additional challenger"
      ],
      "discriminator": [
        223,
        204,
        21,
        113,
        209,
        155,
        162,
        77
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "challenger"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerPool",
          "docs": [
            "Challenger's pool - created if doesn't exist"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "detailsCid",
          "type": "string"
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerChallenger",
      "docs": [
        "Register as a challenger"
      ],
      "discriminator": [
        69,
        151,
        151,
        202,
        4,
        226,
        241,
        134
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengerPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerJuror",
      "docs": [
        "Register as a juror"
      ],
      "discriminator": [
        116,
        81,
        98,
        42,
        220,
        219,
        2,
        141
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "docs": [
        "Resolve a dispute after voting period ends"
      ],
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "resolver",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "protocolConfig",
          "docs": [
            "Protocol config for treasury address"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury receives platform fee"
          ],
          "writable": true
        },
        {
          "name": "creatorDefenderPool",
          "docs": [
            "Optional: Creator's defender pool for auto-rebond on defender win"
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "creatorDefenderRecord",
          "docs": [
            "Optional: Creator's defender record - initialized via init_if_needed",
            "Uses subject.creator and next_round for PDA seeds"
          ],
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [100, 101, 102, 101, 110, 100, 101, 114, 95, 114, 101, 99, 111, 114, 100]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "subject.creator",
                "account": "subject"
              },
              {
                "kind": "arg",
                "path": "next_round"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nextRound",
          "type": "u32"
        }
      ]
    },
    {
      "name": "submitRestore",
      "docs": [
        "Submit a restoration request for an invalidated subject"
      ],
      "discriminator": [
        32,
        59,
        202,
        78,
        224,
        183,
        80,
        191
      ],
      "accounts": [
        {
          "name": "restorer",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "challengerRecord",
          "docs": [
            "Challenger record for the restorer (acts as first challenger)"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "disputeType",
          "type": {
            "defined": {
              "name": "disputeType"
            }
          }
        },
        {
          "name": "detailsCid",
          "type": "string"
        },
        {
          "name": "stakeAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sweepRoundCreator",
      "docs": [
        "Creator sweep unclaimed funds (after 30 days)"
      ],
      "discriminator": [
        171,
        13,
        243,
        211,
        73,
        235,
        65,
        30
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "sweepRoundTreasury",
      "docs": [
        "Treasury sweep unclaimed funds (after 90 days)"
      ],
      "discriminator": [
        224,
        70,
        132,
        233,
        159,
        248,
        133,
        130
      ],
      "accounts": [
        {
          "name": "sweeper",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "protocolConfig",
          "docs": [
            "Protocol config for treasury address"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury receives swept funds"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "unlockJurorStake",
      "docs": [
        "Unlock juror stake (7 days after resolution)"
      ],
      "discriminator": [
        109,
        73,
        56,
        32,
        115,
        125,
        5,
        242
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "arg",
                "path": "round"
              }
            ]
          }
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "round",
          "type": "u32"
        }
      ]
    },
    {
      "name": "unregisterJuror",
      "docs": [
        "Unregister juror"
      ],
      "discriminator": [
        199,
        200,
        113,
        139,
        182,
        118,
        206,
        124
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "updateMaxBond",
      "docs": [
        "Update max_bond setting for defender pool"
      ],
      "discriminator": [
        19,
        70,
        113,
        22,
        140,
        149,
        203,
        23
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newMaxBond",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateTreasury",
      "docs": [
        "Update treasury address (admin only)"
      ],
      "discriminator": [
        60,
        16,
        243,
        66,
        96,
        59,
        254,
        131
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newTreasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "voteOnDispute",
      "docs": [
        "Vote on a dispute"
      ],
      "discriminator": [
        7,
        213,
        96,
        171,
        252,
        59,
        55,
        23
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": {
            "defined": {
              "name": "voteChoice"
            }
          }
        },
        {
          "name": "stakeAllocation",
          "type": "u64"
        },
        {
          "name": "rationaleCid",
          "type": "string"
        }
      ]
    },
    {
      "name": "voteOnRestore",
      "docs": [
        "Vote on a restoration"
      ],
      "discriminator": [
        122,
        123,
        92,
        240,
        251,
        205,
        189,
        32
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "subject",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  117,
                  98,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "dispute",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  105,
                  115,
                  112,
                  117,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "jurorRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  114,
                  101,
                  99,
                  111,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "subject.subject_id",
                "account": "subject"
              },
              {
                "kind": "account",
                "path": "juror"
              },
              {
                "kind": "account",
                "path": "subject.round",
                "account": "subject"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": {
            "defined": {
              "name": "restoreVoteChoice"
            }
          }
        },
        {
          "name": "stakeAllocation",
          "type": "u64"
        },
        {
          "name": "rationaleCid",
          "type": "string"
        }
      ]
    },
    {
      "name": "withdrawChallengerStake",
      "docs": [
        "Withdraw from challenger pool"
      ],
      "discriminator": [
        78,
        33,
        10,
        217,
        10,
        63,
        81,
        45
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengerPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "challenger"
              }
            ]
          }
        },
        {
          "name": "protocolConfig",
          "docs": [
            "Protocol config for treasury address"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury receives slashed amounts"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawDefenderPool",
      "docs": [
        "Withdraw from defender pool"
      ],
      "discriminator": [
        34,
        62,
        12,
        146,
        220,
        10,
        123,
        61
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "defenderPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  102,
                  101,
                  110,
                  100,
                  101,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawJurorStake",
      "docs": [
        "Withdraw from juror pool"
      ],
      "discriminator": [
        178,
        43,
        144,
        250,
        188,
        199,
        135,
        133
      ],
      "accounts": [
        {
          "name": "juror",
          "writable": true,
          "signer": true
        },
        {
          "name": "jurorPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  106,
                  117,
                  114,
                  111,
                  114,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "juror"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "challengerPool",
      "discriminator": [
        88,
        158,
        225,
        15,
        47,
        185,
        77,
        238
      ]
    },
    {
      "name": "challengerRecord",
      "discriminator": [
        8,
        80,
        134,
        108,
        192,
        142,
        121,
        14
      ]
    },
    {
      "name": "defenderPool",
      "discriminator": [
        227,
        100,
        92,
        157,
        203,
        252,
        63,
        118
      ]
    },
    {
      "name": "defenderRecord",
      "discriminator": [
        14,
        3,
        219,
        215,
        38,
        254,
        254,
        92
      ]
    },
    {
      "name": "dispute",
      "discriminator": [
        36,
        49,
        241,
        67,
        40,
        36,
        241,
        74
      ]
    },
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "jurorPool",
      "discriminator": [
        217,
        104,
        42,
        167,
        209,
        1,
        171,
        33
      ]
    },
    {
      "name": "jurorRecord",
      "discriminator": [
        144,
        76,
        94,
        12,
        102,
        207,
        151,
        40
      ]
    },
    {
      "name": "protocolConfig",
      "discriminator": [
        207,
        91,
        250,
        28,
        152,
        179,
        215,
        209
      ]
    },
    {
      "name": "subject",
      "discriminator": [
        52,
        161,
        41,
        165,
        202,
        238,
        138,
        166
      ]
    }
  ],
  "events": [
    {
      "name": "addToVoteEvent",
      "discriminator": [
        228,
        249,
        101,
        93,
        5,
        47,
        190,
        66
      ]
    },
    {
      "name": "bondAddedEvent",
      "discriminator": [
        139,
        73,
        9,
        193,
        204,
        12,
        69,
        174
      ]
    },
    {
      "name": "bondWithdrawnEvent",
      "discriminator": [
        1,
        22,
        115,
        176,
        15,
        248,
        123,
        151
      ]
    },
    {
      "name": "challengerJoinedEvent",
      "discriminator": [
        163,
        95,
        96,
        131,
        237,
        97,
        229,
        35
      ]
    },
    {
      "name": "disputeCreatedEvent",
      "discriminator": [
        89,
        162,
        48,
        158,
        30,
        116,
        145,
        247
      ]
    },
    {
      "name": "disputeResolvedEvent",
      "discriminator": [
        152,
        37,
        98,
        245,
        229,
        39,
        150,
        78
      ]
    },
    {
      "name": "poolDepositEvent",
      "discriminator": [
        17,
        52,
        153,
        164,
        206,
        202,
        228,
        220
      ]
    },
    {
      "name": "poolWithdrawEvent",
      "discriminator": [
        4,
        215,
        203,
        122,
        8,
        73,
        179,
        46
      ]
    },
    {
      "name": "recordClosedEvent",
      "discriminator": [
        127,
        196,
        65,
        213,
        113,
        178,
        80,
        55
      ]
    },
    {
      "name": "restoreResolvedEvent",
      "discriminator": [
        151,
        57,
        204,
        231,
        9,
        240,
        171,
        205
      ]
    },
    {
      "name": "restoreSubmittedEvent",
      "discriminator": [
        91,
        160,
        93,
        112,
        192,
        112,
        155,
        30
      ]
    },
    {
      "name": "restoreVoteEvent",
      "discriminator": [
        54,
        218,
        241,
        44,
        90,
        247,
        210,
        238
      ]
    },
    {
      "name": "rewardClaimedEvent",
      "discriminator": [
        246,
        43,
        215,
        228,
        82,
        49,
        230,
        56
      ]
    },
    {
      "name": "roundSweptEvent",
      "discriminator": [
        245,
        127,
        207,
        243,
        30,
        229,
        3,
        134
      ]
    },
    {
      "name": "stakeUnlockedEvent",
      "discriminator": [
        99,
        31,
        70,
        177,
        150,
        105,
        180,
        93
      ]
    },
    {
      "name": "subjectCreatedEvent",
      "discriminator": [
        70,
        23,
        14,
        215,
        220,
        223,
        89,
        17
      ]
    },
    {
      "name": "subjectStatusChangedEvent",
      "discriminator": [
        118,
        28,
        47,
        229,
        59,
        42,
        149,
        118
      ]
    },
    {
      "name": "voteEvent",
      "discriminator": [
        195,
        71,
        250,
        105,
        120,
        119,
        234,
        134
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientBalance",
      "msg": "Insufficient balance in defender pool"
    }
  ],
  "types": [
    {
      "name": "addToVoteEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "juror",
            "type": "pubkey"
          },
          {
            "name": "additionalStake",
            "type": "u64"
          },
          {
            "name": "additionalVotingPower",
            "type": "u64"
          },
          {
            "name": "totalStake",
            "type": "u64"
          },
          {
            "name": "totalVotingPower",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "bondAddedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "defender",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "source",
            "type": {
              "defined": {
                "name": "bondSource"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "bondSource",
      "docs": [
        "Source of bond funds"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "direct"
          },
          {
            "name": "pool"
          }
        ]
      }
    },
    {
      "name": "bondWithdrawnEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "defender",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "challengerJoinedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "challenger",
            "type": "pubkey"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "totalStake",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "challengerPool",
      "docs": [
        "Challenger's pool for holding stake funds",
        "Seeds: [CHALLENGER_POOL_SEED, owner]",
        "One per user, persistent"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Pool owner's wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "balance",
            "docs": [
              "Available balance"
            ],
            "type": "u64"
          },
          {
            "name": "reputation",
            "docs": [
              "Reputation score (6 decimals, 100% = 100_000_000)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "challengerRecord",
      "docs": [
        "Individual challenger's stake for a specific subject round",
        "Seeds: [CHALLENGER_RECORD_SEED, subject_id, challenger, round]",
        "Created per round, closed after claim"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "The subject_id this record belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "challenger",
            "docs": [
              "Challenger's wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "round",
            "docs": [
              "Which round this stake is for"
            ],
            "type": "u32"
          },
          {
            "name": "stake",
            "docs": [
              "Stake amount contributed to the dispute"
            ],
            "type": "u64"
          },
          {
            "name": "detailsCid",
            "docs": [
              "Evidence CID (IPFS hash)"
            ],
            "type": "string"
          },
          {
            "name": "rewardClaimed",
            "docs": [
              "Whether reward has been claimed"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "challengedAt",
            "docs": [
              "Timestamp when this challenger joined"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "claimRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "defender"
          },
          {
            "name": "challenger"
          },
          {
            "name": "juror"
          }
        ]
      }
    },
    {
      "name": "defenderPool",
      "docs": [
        "Defender's pool for holding bond funds",
        "Seeds: [DEFENDER_POOL_SEED, owner]",
        "One per user, persistent"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Pool owner's wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "balance",
            "docs": [
              "Available balance (not locked in active bonds)"
            ],
            "type": "u64"
          },
          {
            "name": "maxBond",
            "docs": [
              "Max bond per subject (for auto-allocation)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last update timestamp"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "defenderRecord",
      "docs": [
        "Individual defender's bond for a specific subject round",
        "Seeds: [DEFENDER_RECORD_SEED, subject_id, defender, round]",
        "Created per round, closed after claim"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "The subject_id this record belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "defender",
            "docs": [
              "Defender's wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "round",
            "docs": [
              "Which round this bond is for"
            ],
            "type": "u32"
          },
          {
            "name": "bond",
            "docs": [
              "Bond amount backing the subject"
            ],
            "type": "u64"
          },
          {
            "name": "source",
            "docs": [
              "Source of bond funds"
            ],
            "type": {
              "defined": {
                "name": "bondSource"
              }
            }
          },
          {
            "name": "rewardClaimed",
            "docs": [
              "Whether reward has been claimed"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "bondedAt",
            "docs": [
              "Timestamp when this defender bonded"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "dispute",
      "docs": [
        "Dispute - Persistent PDA, reset after each round",
        "Seeds: [DISPUTE_SEED, subject_id]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "Subject being disputed (subject_id, not Subject PDA)"
            ],
            "type": "pubkey"
          },
          {
            "name": "round",
            "docs": [
              "Which round this dispute is for"
            ],
            "type": "u32"
          },
          {
            "name": "status",
            "docs": [
              "Dispute status"
            ],
            "type": {
              "defined": {
                "name": "disputeStatus"
              }
            }
          },
          {
            "name": "disputeType",
            "docs": [
              "Dispute type"
            ],
            "type": {
              "defined": {
                "name": "disputeType"
              }
            }
          },
          {
            "name": "totalStake",
            "docs": [
              "Total stake from all challengers"
            ],
            "type": "u64"
          },
          {
            "name": "challengerCount",
            "docs": [
              "Number of challengers"
            ],
            "type": "u16"
          },
          {
            "name": "bondAtRisk",
            "docs": [
              "Bond at risk (calculated based on mode)",
              "Match: min(total_stake, available_bond)",
              "Prop: available_bond"
            ],
            "type": "u64"
          },
          {
            "name": "defenderCount",
            "docs": [
              "Number of defenders (snapshot at dispute creation, updated if new defenders join)"
            ],
            "type": "u16"
          },
          {
            "name": "votesForChallenger",
            "docs": [
              "Cumulative voting power for challenger"
            ],
            "type": "u64"
          },
          {
            "name": "votesForDefender",
            "docs": [
              "Cumulative voting power for defender"
            ],
            "type": "u64"
          },
          {
            "name": "voteCount",
            "docs": [
              "Number of jurors who voted"
            ],
            "type": "u16"
          },
          {
            "name": "votingStartsAt",
            "docs": [
              "Voting start timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "votingEndsAt",
            "docs": [
              "Voting end timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "outcome",
            "docs": [
              "Resolution outcome"
            ],
            "type": {
              "defined": {
                "name": "resolutionOutcome"
              }
            }
          },
          {
            "name": "resolvedAt",
            "docs": [
              "Resolution timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "isRestore",
            "docs": [
              "True if this dispute is a restoration request"
            ],
            "type": "bool"
          },
          {
            "name": "restoreStake",
            "docs": [
              "Stake posted by restorer (for restorations only)"
            ],
            "type": "u64"
          },
          {
            "name": "restorer",
            "docs": [
              "Restorer's pubkey (for restorations only)"
            ],
            "type": "pubkey"
          },
          {
            "name": "detailsCid",
            "docs": [
              "Details CID (IPFS hash for dispute details)"
            ],
            "type": "string"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "disputeCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "bondAtRisk",
            "type": "u64"
          },
          {
            "name": "votingEndsAt",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "disputeResolvedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "outcome",
            "type": {
              "defined": {
                "name": "resolutionOutcome"
              }
            }
          },
          {
            "name": "totalStake",
            "type": "u64"
          },
          {
            "name": "bondAtRisk",
            "type": "u64"
          },
          {
            "name": "winnerPool",
            "type": "u64"
          },
          {
            "name": "jurorPool",
            "type": "u64"
          },
          {
            "name": "resolvedAt",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "disputeStatus",
      "docs": [
        "Dispute status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "pending"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "disputeType",
      "docs": [
        "Dispute type (generic categories)"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "other"
          },
          {
            "name": "breach"
          },
          {
            "name": "fraud"
          },
          {
            "name": "qualityDispute"
          },
          {
            "name": "nonDelivery"
          },
          {
            "name": "misrepresentation"
          },
          {
            "name": "policyViolation"
          },
          {
            "name": "damagesClaim"
          }
        ]
      }
    },
    {
      "name": "escrow",
      "docs": [
        "Escrow account - holds funds for claims across rounds",
        "Seeds: [ESCROW_SEED, subject_id]",
        "Persistent PDA - created once, reused"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "Subject this escrow belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "balance",
            "docs": [
              "Current balance available for claims"
            ],
            "type": "u64"
          },
          {
            "name": "rounds",
            "docs": [
              "Historical round results for claims",
              "Vec grows with realloc on dispute creation, shrinks on last claim"
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "roundResult"
                }
              }
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "jurorPool",
      "docs": [
        "Juror's pool for holding voting stake",
        "Seeds: [JUROR_POOL_SEED, owner]",
        "One per user, persistent"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Juror's wallet address"
            ],
            "type": "pubkey"
          },
          {
            "name": "balance",
            "docs": [
              "Available balance"
            ],
            "type": "u64"
          },
          {
            "name": "reputation",
            "docs": [
              "Reputation score (6 decimals, 100% = 100_000_000)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "createdAt",
            "docs": [
              "Registration timestamp"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "jurorRecord",
      "docs": [
        "Juror's vote record for a specific subject round",
        "Seeds: [JUROR_RECORD_SEED, subject_id, juror, round]",
        "Created per round, closed after claim"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "The subject_id this record belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "juror",
            "docs": [
              "Juror who cast the vote"
            ],
            "type": "pubkey"
          },
          {
            "name": "round",
            "docs": [
              "Which round this vote is for"
            ],
            "type": "u32"
          },
          {
            "name": "choice",
            "docs": [
              "Vote choice for regular disputes"
            ],
            "type": {
              "defined": {
                "name": "voteChoice"
              }
            }
          },
          {
            "name": "restoreChoice",
            "docs": [
              "Vote choice for restorations (only used when is_restore_vote is true)"
            ],
            "type": {
              "defined": {
                "name": "restoreVoteChoice"
              }
            }
          },
          {
            "name": "isRestoreVote",
            "docs": [
              "Whether this is a restoration vote"
            ],
            "type": "bool"
          },
          {
            "name": "votingPower",
            "docs": [
              "Calculated voting power"
            ],
            "type": "u64"
          },
          {
            "name": "stakeAllocation",
            "docs": [
              "Stake allocated (locked from juror pool)"
            ],
            "type": "u64"
          },
          {
            "name": "rewardClaimed",
            "docs": [
              "Whether reward has been claimed"
            ],
            "type": "bool"
          },
          {
            "name": "stakeUnlocked",
            "docs": [
              "Whether stake has been unlocked (7 days after voting ends)"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "votedAt",
            "docs": [
              "Vote timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "rationaleCid",
            "docs": [
              "IPFS CID for vote rationale (optional)"
            ],
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "poolDepositEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolType",
            "type": {
              "defined": {
                "name": "poolType"
              }
            }
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "poolType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "defender"
          },
          {
            "name": "challenger"
          },
          {
            "name": "juror"
          }
        ]
      }
    },
    {
      "name": "poolWithdrawEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolType",
            "type": {
              "defined": {
                "name": "poolType"
              }
            }
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "slashed",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "protocolConfig",
      "docs": [
        "Protocol-wide configuration account",
        "Stores treasury address and admin authority for fee collection"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Admin who can update config (deployer initially)"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Platform fee recipient address"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "recordClosedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "claimRole"
              }
            }
          },
          {
            "name": "rentReturned",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "resolutionOutcome",
      "docs": [
        "Resolution outcome"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "challengerWins"
          },
          {
            "name": "defenderWins"
          },
          {
            "name": "noParticipation"
          }
        ]
      }
    },
    {
      "name": "restoreResolvedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "outcome",
            "type": {
              "defined": {
                "name": "resolutionOutcome"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "restoreSubmittedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "restorer",
            "type": "pubkey"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "detailsCid",
            "type": "string"
          },
          {
            "name": "votingPeriod",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "restoreVoteChoice",
      "docs": [
        "Vote choice for restorations"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "forRestoration"
          },
          {
            "name": "againstRestoration"
          }
        ]
      }
    },
    {
      "name": "restoreVoteEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "juror",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": {
              "defined": {
                "name": "restoreVoteChoice"
              }
            }
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "rationaleCid",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rewardClaimedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "claimer",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "claimRole"
              }
            }
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "roundResult",
      "docs": [
        "Result data for a completed round, stored in Escrow",
        "Used for claim calculations after resolution"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "round",
            "docs": [
              "Round number"
            ],
            "type": "u32"
          },
          {
            "name": "creator",
            "docs": [
              "Dispute creator (for rent refund on last claim or sweep)"
            ],
            "type": "pubkey"
          },
          {
            "name": "resolvedAt",
            "docs": [
              "Resolution timestamp (for grace period calculation)"
            ],
            "type": "i64"
          },
          {
            "name": "outcome",
            "docs": [
              "Resolution outcome"
            ],
            "type": {
              "defined": {
                "name": "resolutionOutcome"
              }
            }
          },
          {
            "name": "totalStake",
            "docs": [
              "Total stake from challengers"
            ],
            "type": "u64"
          },
          {
            "name": "bondAtRisk",
            "docs": [
              "Bond at risk from defenders"
            ],
            "type": "u64"
          },
          {
            "name": "safeBond",
            "docs": [
              "Safe bond (available_bond - bond_at_risk) returned to defenders"
            ],
            "type": "u64"
          },
          {
            "name": "totalVoteWeight",
            "docs": [
              "Total voting power cast"
            ],
            "type": "u64"
          },
          {
            "name": "winnerPool",
            "docs": [
              "Winner pool amount (80%)"
            ],
            "type": "u64"
          },
          {
            "name": "jurorPool",
            "docs": [
              "Juror pool amount (19%)"
            ],
            "type": "u64"
          },
          {
            "name": "defenderCount",
            "docs": [
              "Number of defenders"
            ],
            "type": "u16"
          },
          {
            "name": "challengerCount",
            "docs": [
              "Number of challengers"
            ],
            "type": "u16"
          },
          {
            "name": "jurorCount",
            "docs": [
              "Number of jurors"
            ],
            "type": "u16"
          },
          {
            "name": "defenderClaims",
            "docs": [
              "Number of defenders who have claimed"
            ],
            "type": "u16"
          },
          {
            "name": "challengerClaims",
            "docs": [
              "Number of challengers who have claimed"
            ],
            "type": "u16"
          },
          {
            "name": "jurorClaims",
            "docs": [
              "Number of jurors who have claimed"
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "roundSweptEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "sweeper",
            "type": "pubkey"
          },
          {
            "name": "unclaimed",
            "type": "u64"
          },
          {
            "name": "botReward",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "stakeUnlockedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "juror",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "subject",
      "docs": [
        "Subject that defenders back - identified by subject_id",
        "Persistent PDA - created once, reused across rounds"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "docs": [
              "Subject identifier (could be PDA from external program)"
            ],
            "type": "pubkey"
          },
          {
            "name": "creator",
            "docs": [
              "Creator of this subject (for auto-bond on reset)"
            ],
            "type": "pubkey"
          },
          {
            "name": "detailsCid",
            "docs": [
              "Content CID (IPFS hash for subject details)"
            ],
            "type": "string"
          },
          {
            "name": "round",
            "docs": [
              "Current round counter (0, 1, 2, ...)"
            ],
            "type": "u32"
          },
          {
            "name": "availableBond",
            "docs": [
              "Total bond available for current round"
            ],
            "type": "u64"
          },
          {
            "name": "defenderCount",
            "docs": [
              "Number of defenders in current round"
            ],
            "type": "u16"
          },
          {
            "name": "status",
            "docs": [
              "Current status"
            ],
            "type": {
              "defined": {
                "name": "subjectStatus"
              }
            }
          },
          {
            "name": "matchMode",
            "docs": [
              "Match mode: true = bond_at_risk matches stake, false = proportionate (all bond at risk)"
            ],
            "type": "bool"
          },
          {
            "name": "votingPeriod",
            "docs": [
              "Voting period in seconds for this subject's disputes"
            ],
            "type": "i64"
          },
          {
            "name": "dispute",
            "docs": [
              "Current active dispute (if any)"
            ],
            "type": "pubkey"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last update timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "lastDisputeTotal",
            "docs": [
              "Previous dispute's (stake + bond) - minimum stake required for restoration"
            ],
            "type": "u64"
          },
          {
            "name": "lastVotingPeriod",
            "docs": [
              "Previous dispute's voting period - restorations use 2x this value"
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "subjectCreatedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "matchMode",
            "type": "bool"
          },
          {
            "name": "votingPeriod",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "subjectStatus",
      "docs": [
        "Subject status"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "dormant"
          },
          {
            "name": "valid"
          },
          {
            "name": "disputed"
          },
          {
            "name": "invalid"
          },
          {
            "name": "restoring"
          }
        ]
      }
    },
    {
      "name": "subjectStatusChangedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "oldStatus",
            "type": "u8"
          },
          {
            "name": "newStatus",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteChoice",
      "docs": [
        "Vote choice for disputes"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "forChallenger"
          },
          {
            "name": "forDefender"
          }
        ]
      }
    },
    {
      "name": "voteEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "subjectId",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u32"
          },
          {
            "name": "juror",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": {
              "defined": {
                "name": "voteChoice"
              }
            }
          },
          {
            "name": "votingPower",
            "type": "u64"
          },
          {
            "name": "rationaleCid",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
