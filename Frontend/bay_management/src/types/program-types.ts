export type BayAttendanceCheck = {
  "version": "0.1.0",
  "name": "bay_attendance_check",
  "instructions": [
    {
      "name": "checkIn",
      "accounts": [
        {
          "name": "memberWallet",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "attendanceRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializeMember",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memberWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "role",
          "type": {
            "defined": "MemberRole"
          }
        }
      ]
    },
    {
      "name": "initializeSession",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sessionDate",
          "type": "i64"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "lateTime",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": {
              "defined": "MemberRole"
            }
          },
          {
            "name": "totalAttendance",
            "type": "u32"
          },
          {
            "name": "totalLate",
            "type": "u32"
          },
          {
            "name": "totalAbsence",
            "type": "u32"
          },
          {
            "name": "totalPoints",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "session",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "sessionDate",
            "type": "i64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "lateTime",
            "type": "i64"
          },
          {
            "name": "totalAttendees",
            "type": "u32"
          },
          {
            "name": "totalLate",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MemberRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Admin"
          },
          {
            "name": "Member"
          }
        ]
      }
    }
  ]
};

export const IDL: BayAttendanceCheck = {
  "version": "0.1.0",
  "name": "bay_attendance_check",
  "instructions": [
    {
      "name": "checkIn",
      "accounts": [
        {
          "name": "memberWallet",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "attendanceRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializeMember",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "memberWallet",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "role",
          "type": {
            "defined": "MemberRole"
          }
        }
      ]
    },
    {
      "name": "initializeSession",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sessionDate",
          "type": "i64"
        },
        {
          "name": "startTime",
          "type": "i64"
        },
        {
          "name": "lateTime",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "role",
            "type": {
              "defined": "MemberRole"
            }
          },
          {
            "name": "totalAttendance",
            "type": "u32"
          },
          {
            "name": "totalLate",
            "type": "u32"
          },
          {
            "name": "totalAbsence",
            "type": "u32"
          },
          {
            "name": "totalPoints",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "session",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "sessionDate",
            "type": "i64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "lateTime",
            "type": "i64"
          },
          {
            "name": "totalAttendees",
            "type": "u32"
          },
          {
            "name": "totalLate",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MemberRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Admin"
          },
          {
            "name": "Member"
          }
        ]
      }
    }
  ]
};