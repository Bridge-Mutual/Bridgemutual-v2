# `TetherPausable`

Base contract which allows children to implement an emergency stop mechanism.

## Event Pause
## Signature `event` Pause()




**Params**

## Event Unpause
## Signature `event` Unpause()




**Params**


# Function pause

Dev called by the owner to pause, triggers stopped state
## Signature pause()
## `pause()` (public)
*Params**

**Returns**
-----
# Function unpause

Dev called by the owner to unpause, returns to normal state
## Signature unpause()
## `unpause()` (public)
*Params**

**Returns**
-----
# Function constructor

Dev The Ownable constructor sets the original `owner` of the contract to the sender
account.
## Signature constructor()
## `constructor()` (public)
*Params**

**Returns**
-----
# Function transferOwnership

Dev Allows the current owner to transfer control of the contract to a newOwner.

## Signature transferOwnership(address)
## `transferOwnership(address newOwner)` (public)
*Params**
 - `newOwner`: The address to transfer ownership to.

**Returns**
-----

