type Block =
  | { kind: "list"; items: readonly string[] }
  | { kind: "text" | "code"; text: string };

export type Question = {
  title: string;
  description: string;
  signature: string;
  sections: readonly { heading: string; blocks: readonly Block[] }[];
  examples: readonly { code: string; explanation: string }[];
  starter: string;
};

export const questions = [
  {
    "title": "Conveyor Network Maintenance",
    "description": "A distribution company operates warehouses connected by two-way conveyor links. Technicians open and close individual links throughout the day. For each audit request, report whether two warehouses can exchange parcels and how many warehouses each one can currently reach.",
    "signature": "def audit_conveyor_network(n, operations):",
    "sections": [
      {
        "heading": "Inputs",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "Warehouses are numbered from 1 to n. All links are closed before the first operation.",
              "operations is a list of records in chronological order. Each record has the form [action, u, v], where action is OPEN, CLOSE, or QUERY.",
              "OPEN activates the undirected link between u and v. CLOSE deactivates that same link. The order of the endpoints does not matter. A closed link can be opened again later.",
              "When action is QUERY, consider only the links that are active at that point. Two warehouses are connected if a path of active links joins them. A warehouse can always reach itself."
            ]
          }
        ]
      },
      {
        "heading": "Output",
        "blocks": [
          {
            "kind": "text",
            "text": "Return one row for each QUERY, in the order the queries appear."
          },
          {
            "kind": "code",
            "text": "[connected, size_u, size_v]"
          },
          {
            "kind": "text",
            "text": "connected is 1 if u and v are connected and 0 otherwise. size_u and size_v are the numbers of warehouses reachable from u and v, including the starting warehouse. If u and v are connected, the two sizes are equal. An isolated warehouse has size 1. Return [] when there are no queries."
          }
        ]
      },
      {
        "heading": "Constraints",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "1 <= n <= 100,000.",
              "0 <= len(operations) <= 200,000.",
              "1 <= u, v <= n. OPEN and CLOSE always have distinct endpoints. QUERY can use the same warehouse twice.",
              "An OPEN always refers to a closed link. A CLOSE always refers to an active link. There is at most one active link for each unordered pair.",
              "Use only the Python standard library. Return the result from the function and handle the full input limits."
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "code": "n = 5\noperations = [\n    [\"OPEN\", 1, 2],\n    [\"OPEN\", 2, 3],\n    [\"QUERY\", 1, 3],\n    [\"OPEN\", 4, 5],\n    [\"QUERY\", 1, 5],\n    [\"OPEN\", 3, 4],\n    [\"QUERY\", 5, 2],\n    [\"CLOSE\", 2, 3],\n    [\"QUERY\", 2, 4],\n    [\"OPEN\", 3, 2],\n    [\"QUERY\", 1, 5],\n]\nexpected = [[1, 3, 3], [0, 3, 2], [1, 5, 5], [0, 2, 3], [1, 5, 5]]",
        "explanation": "Closing the link between 2 and 3 splits the network into groups of sizes 2 and 3. Reopening the link as [3, 2] joins all five warehouses again."
      },
      {
        "code": "n = 4\noperations = [\n    [\"QUERY\", 4, 4],\n    [\"OPEN\", 1, 2],\n    [\"OPEN\", 2, 3],\n    [\"OPEN\", 3, 1],\n    [\"CLOSE\", 2, 1],\n    [\"QUERY\", 1, 2],\n    [\"CLOSE\", 1, 3],\n    [\"QUERY\", 1, 2],\n]\nexpected = [[1, 1, 1], [1, 3, 3], [0, 1, 2]]",
        "explanation": "The first query is on an isolated warehouse. After closing the link between 1 and 2, those warehouses can still exchange parcels via 3. Closing the link between 1 and 3 then isolates warehouse 1."
      }
    ],
    "starter": "def audit_conveyor_network(n, operations):\n    pass\n"
  },
  {
    "title": "Minimum-Time Parcel Batches",
    "description": "A parcel inspection station receives a line of parcels in a fixed order. It can inspect the parcels within a batch in parallel, so the batch finishes when its slowest parcel finishes. The station handles one batch at a time. Split the line into batches to minimize the total inspection time.",
    "signature": "def minimum_inspection_time(parcel_weights, inspection_minutes, max_batch_weight):",
    "sections": [
      {
        "heading": "Inputs and batching rules",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "parcel_weights and inspection_minutes are lists of equal length. At index i, they give the weight and inspection time of the same parcel.",
              "Each batch must be a nonempty consecutive portion of the original line. Every parcel must appear in exactly one batch, and the batches must follow the original order.",
              "The sum of the parcel weights in a batch must be at most max_batch_weight. A batch with weight exactly equal to the limit is allowed.",
              "The time for a batch is the largest inspection time among the parcels in that batch. The total time is the sum of the batch times. There is no limit on the number of batches."
            ]
          }
        ]
      },
      {
        "heading": "Output",
        "blocks": [
          {
            "kind": "text",
            "text": "Return the minimum achievable total inspection time as an integer. If any parcel is heavier than max_batch_weight, return -1. If there are no parcels, return 0."
          }
        ]
      },
      {
        "heading": "Constraints",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "0 <= len(parcel_weights) == len(inspection_minutes) <= 200,000.",
              "1 <= parcel_weights[i], inspection_minutes[i], max_batch_weight <= 10^9.",
              "Use only the Python standard library. Return the result from the function and handle the full input limits."
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "code": "parcel_weights = [1, 1, 1, 1]\ninspection_minutes = [1, 8, 8, 1]\nmax_batch_weight = 2\nexpected = 10",
        "explanation": "Numbering parcels from 1, the best split is [1], [2, 3], [4]. The two slow parcels share a batch, so the total is 1 + 8 + 1 = 10."
      },
      {
        "code": "parcel_weights = [2, 1, 3, 2, 2]\ninspection_minutes = [4, 9, 6, 8, 2]\nmax_batch_weight = 4\nexpected = 21",
        "explanation": "One optimal split is [1], [2, 3], [4, 5]. The last two batches each have weight 4, and the total inspection time is 4 + 9 + 8 = 21."
      },
      {
        "code": "parcel_weights = [2, 6, 1]\ninspection_minutes = [4, 5, 8]\nmax_batch_weight = 5\nexpected = -1",
        "explanation": "The second parcel weighs 6, so it cannot fit even in a batch by itself."
      }
    ],
    "starter": "def minimum_inspection_time(parcel_weights, inspection_minutes, max_batch_weight):\n    pass\n"
  }
] as const satisfies readonly [Question, Question];
