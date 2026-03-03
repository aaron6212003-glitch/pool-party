# Percoco Board: The Bookmaker Expansion (Concept & Plan)

## Overview
The "Bookmaker Expansion" turns the Percoco Board from a retroactive leaderboard into an **active, gamified sports-book**. By integrating with your scheduling app (e.g., Sling/7shifts/Sling), the system will automatically look at who is scheduled to work that day and generate **Over/Under lines** for their:
1. Total Sales
2. Total Takehome Tips

Servers in the Party will use a custom in-app currency (e.g., "Percoco Chips" or "Tokens") to place bets on themselves or their coworkers' shifts before the shift begins.

## 1. How the "Lines" are Generated
The system acts as an automated bookie (the "House"). Every day at 9:00 AM, it generates lines based on:

### The "Veteran" Algorithm (Has historical data)
If a server has >3 logged shifts in the Party history, the House calculates their baseline:
*   **Average Sales per Shift** (weighted towards recent shifts).
*   **Day of Week Multiplier:** E.g., if it's a Friday, their baseline is multiplied by 1.4x based on past Friday performance.
*   **The Vigorish (The Juice):** The House slightly inflates the line to make it challenging. If John's historical average is $1,400 on Fridays, the over/under line might be set at **Sales O/U $1,450**.

### The "Rookie" Algorithm (No historical data)
If a server is new to the app or has <3 shifts:
*   The system takes the **Party's Global Average** for that specific day of the week.
*   The line is set statically based on the floor average. As they log more shifts, their lines become personalized.

## 2. In-App Economy & Currency
*   **Currency Name:** "Chips" 🪙 (or "Shift Coins", "Tickets").
*   **Bankroll:** Everyone starts the week with **100 Chips**.
*   **Weekly Reset:** Bankrolls reset to 100 on Monday mornings to keep it competitive, preventing runaway leaders.
*   **Betting:** Placing an Over or Under bet costs 10 Chips.
*   **Payout:** Winning a bet pays out 20 Chips (Net +10).

## 3. The Bet Slip & Rules
*   **The Ticket Window:** The "Sportsbook" tab opens at 9:00 AM. 
*   **Lockout:** Bets are locked at 4:30 PM (or whenever the first scheduled shift starts). Once a shift begins, no one can place bets.
*   **Betting on Yourself allowed?** Absolutely. Betting the *OVER* on yourself is the ultimate motivational tool. Betting the *UNDER* on yourself is an emotional hedge.

## 4. Integration with Sling
To make this work automatically, we need to know who is working.
1.  **Sling API:** We will hook a backend cron-job into the Sling REST API or a webhook.
2.  **Daily Sync:** Every morning, our server pulls the roster for that day.
3.  **Name Matching:** It matches the first/last names from Sling to the `group_members` in your Percoco Party.
4.  **Slip Generation:** For every matched user, it generates their Over/Under lines and publishes them to the Feed.

## 5. UI Additions
1.  **"Sportsbook" Tab:** A new tab alongside Leaderboard and Feed.
2.  **Live Slips:** A UI displaying cards for each working server: 
    *   *Sarah M. - Over/Under $150.00 Tips* [Place Bet: O/U]
3.  **The Wallet Tracker:** A persistent token counter in the header showing your current Bankroll.
4.  **Bet Resolution System:** When a user logs their shift at the end of the night via the existing "Log Shift" form, the system instantly evaluates the bets placed on them and pays out the winners. Let's say Sarah logs $162 in tips. The system instantly messages the Feed: *"Sarah hit the OVER! Paying out 20 chips to: John, Mike, Alex."*

## 6. Implementation Phasing
**Phase 1:** Add the DB tables (`bankrolls` and `bets`). Implement manual line generation (an Admin types in the O/U for 3 coworkers).
**Phase 2:** Implement the UI (Sportsbook tab, wager submission, wallet). 
**Phase 3:** Create the Resolution logic (evaluating bets when shifts are submitted).
**Phase 4:** Hook up the Sling API for full automation.
