# tgtg-checker
Backend Tgtg Checker for specific items and notify using Pushover Service (pushover.net).

## ENV Configuration
In order to run the tgtg service, following env are required.

| Variable | Example | Description  |
| ------------- |:-------------:| -----:|
| TGTG_ACCESS_TOKEN | e30.xxxxxxxxxxx | Access token from tgtg to access api |
| TGTG_REFRESH_TOKEN | e30.xxxxxxxxxxx | Token for getting new tokens |
| TGTG_User | 123456789    | tgtg account id (only digits)|
| PO_USER | xxxxxxxxxxx | user id for Pushover service |
| PO_TOKEN | zzzzzzzzzzz | token for Pushover service |
| REQ_TIMER | 60 | Repeat every 60 seconds |
| ITEMS | ["298070","123456"] | List of item id which will be checked |

## Hint
Too frequent access of the api might getting banned. So try to keep it low (e.g. 1 req per 8 seconds). 

### Example
In above e.g. we have a timer of 60 seconds and a list with 2 items.
- 1:00:00 started the checker
- 1:00:00 check item 298070
- 1:00:08 check item 123456 (8 seconds delay is hard coded)
- 1:01:00 check item 298070 (60 seconds is over)
- ...


# License
MIT