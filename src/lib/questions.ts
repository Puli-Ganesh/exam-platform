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
    "title": "Warehouse Reservation Audit",
    "description": "An online retailer accepts reservations for multiple products. A reservation temporarily locks units of a product. Physical stock can also change when a warehouse receives a replenishment or corrects its count. Given a historical feed, report which products could not cover all their active reservations and summarize the shortage for each affected product.",
    "signature": "def audit_reservations(initial_stock, reservations, stock_changes):",
    "sections": [
      {
        "heading": "Inputs",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "initial_stock is a list of length n. Product IDs are 1 through n. Product sku has initial physical stock initial_stock[sku - 1] immediately before any changes at minute 0.",
              "Each item of reservations is [sku, start, end, units]. These units are reserved from the start minute through the minute before end. The reservation is active throughout the half-open interval [start, end). Different reservations add together, including duplicate records.",
              "Each item of stock_changes is [sku, time, delta]. The signed change takes effect at time and persists until modified by later changes. A positive delta increases stock and a negative delta decreases it. All records are in arbitrary order.",
              "When several changes or reservation boundaries occur at the same minute for one product, apply all effects at that minute together before measuring shortages. Do not measure a momentary shortage between simultaneous changes. After the combined effects at any minute, physical stock is guaranteed to be nonnegative."
            ]
          }
        ]
      },
      {
        "heading": "Output",
        "blocks": [
          {
            "kind": "text",
            "text": "Return a list of lists sorted by increasing sku, one row for each product that ever has a positive shortage:"
          },
          {
            "kind": "code",
            "text": "[sku, first_shortage_minute, peak_shortage, minutes_short, shortage_unit_minutes]"
          },
          {
            "kind": "text",
            "text": "For each minute t, shortage = max(0, active reserved units - physical stock). first_shortage_minute is the earliest integer minute with a positive shortage. peak_shortage is the largest shortage in units. minutes_short counts every integer minute with a positive shortage across all shortage periods. shortage_unit_minutes sums the shortage in units across those minutes. Return [] if there is no shortage."
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
              "len(reservations) + len(stock_changes) <= 200,000.",
              "0 <= initial_stock[i] <= 10^9.",
              "1 <= sku <= n, 0 <= start < end <= 10^9 and 0 <= time <= 10^9.",
              "1 <= units <= 10^9 and -10^9 <= delta <= 10^9.",
              "Submit a function that returns the requested value. Do not read stdin or print answers. Use only the Python standard library. The function must handle the full constraints."
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "code": "initial_stock = [6, 4, 3]\nreservations = [\n    [1, 1, 5, 5], [1, 3, 7, 4], [1, 5, 8, 3],\n    [2, 0, 2, 4], [2, 2, 5, 3], [3, 4, 6, 2]\n]\nstock_changes = [[1, 4, 2], [1, 6, -4], [2, 2, -2], [2, 4, 1]]\nreturn value = [[1, 3, 3, 3, 7], [2, 2, 1, 2, 2]]",
        "explanation": "Product 1 is short by 3 units in minute 3, 1 unit in minute 4, and 3 units in minute 6. Thus it is short for 3 minutes and the total shortage is 7 unit-minutes. Product 2 is short by 1 unit in minutes 2 and 3. Product 3 never has a shortage."
      },
      {
        "code": "initial_stock = [5]\nreservations = [[1, 3, 6, 7], [1, 0, 3, 5]]\nstock_changes = [[1, 3, 3], [1, 3, -1]]\nreturn value = []",
        "explanation": "At minute 3 the earlier reservation ends, the next starts, and the stock changes by a net +2. Demand and stock are both 7 after those events."
      }
    ],
    "starter": "def audit_reservations(initial_stock, reservations, stock_changes):\n    pass\n"
  },
  {
    "title": "Parcel Routing With One Priority Pass",
    "description": "A delivery company routes a parcel between hubs. Ordinary trucks leave each directed lane on a schedule. A single priority pass, when used on an eligible lane, lets a parcel depart that lane as soon as it reaches the departure hub. Find the earliest possible delivery time.",
    "signature": "def earliest_delivery(n, lanes, source, destination, ready_time):",
    "sections": [
      {
        "heading": "Inputs and routing rules",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "Hubs are numbered 1 through n. The parcel is available at source at the integer minute ready_time. Return the earliest absolute minute it can reach destination, or -1 if there is no route.",
              "Each entry in lanes is [u, v, travel, first, period, eligible]. It is a directed lane from u to v, with travel duration travel. Regular departures occur at times first, first + period, first + 2*period, and so on, with no final departure and no departures earlier than first.",
              "To take a regular departure, the parcel must reach u by that departure time. Arrival at exactly the departure minute is allowed. Waiting at any hub is allowed and transfer time is zero.",
              "When eligible = 1, the parcel may spend its priority pass to depart that lane immediately at its arrival minute at u, even before first. Travel duration does not change. At most one pass can be spent across the entire route. A parcel can travel on an eligible lane normally without spending the pass.",
              "Lanes between the same ordered pair of hubs can have different schedules and travel times. Consider them separately. Return ready_time when source equals destination. Return the absolute arrival minute, not elapsed time, a path, or whether a pass was used."
            ]
          }
        ]
      },
      {
        "heading": "Constraints",
        "blocks": [
          {
            "kind": "list",
            "items": [
              "1 <= n <= 100,000 and 0 <= len(lanes) <= 200,000.",
              "1 <= u, v, source, destination <= n; u != v.",
              "1 <= travel, period <= 10^9; 0 <= first, ready_time <= 10^9.",
              "eligible is either 0 or 1. Use only the Python standard library and return the value without reading stdin or printing it. The function must handle the full constraints."
            ]
          }
        ]
      }
    ],
    "examples": [
      {
        "code": "n = 4\nlanes = [\n    [1, 2, 2, 2, 5, 1], [2, 4, 2, 9, 10, 1],\n    [1, 3, 1, 3, 10, 0], [3, 4, 3, 4, 10, 0],\n    [1, 4, 7, 0, 1, 0]\n]\nsource = 1\ndestination = 4\nready_time = 1\nreturn value = 6",
        "explanation": "Take the regular departure from hub 1 to hub 2 at minute 2 and reach hub 2 at minute 4. Spend the pass on the next lane to depart at minute 4 and arrive at hub 4 at minute 6. The route via hub 3 arrives at minute 7. The direct lane arrives at minute 8."
      },
      {
        "code": "n = 3\nlanes = [[1, 2, 4, 5, 10, 0], [2, 3, 3, 9, 12, 0]]\nsource = 1\ndestination = 3\nready_time = 6\nreturn value = 24",
        "explanation": "The parcel misses the first departure and boards at minute 15. It reaches hub 2 at minute 19, boards the next lane at minute 21, and arrives at minute 24. If source and destination are swapped, the result is -1 because the lanes are directed."
      },
      {
        "code": "n = 2\nlanes = [[1, 2, 2, 7, 5, 1], [1, 2, 4, 1, 10, 0]]\nsource = 1\ndestination = 2\nready_time = 3\nreturn value = 5",
        "explanation": "Spending the pass on the first lane allows departure at minute 3 and arrival at minute 5. Its earliest regular arrival is minute 9. The other lane's earliest arrival is minute 15."
      }
    ],
    "starter": "def earliest_delivery(n, lanes, source, destination, ready_time):\n    pass\n"
  }
] as const satisfies readonly [Question, Question];
