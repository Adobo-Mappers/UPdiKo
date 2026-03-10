# About `updi-ko`

![Gif that shows Peak running up the mountain](https://github.com/user-attachments/assets/ac40b878-a459-4599-b7ac-412a9d156214)

**`updi-ko`** is a project made for CMSC 129: Software Engineering 2, UpdiKo is a website to support both local and non-locals in their navigation of Miagao, Iloilo. **`updi-ko`** helps the users locate both fixed services/faciltiies offered in the campus and reccomended facilties that the user may want to know in the local area.

# Features

**`updi-ko`** has certain navigational features:
- A working Map feature to search up locations available to the Map API.
- Have a selectable set of facilties to locate on the map.
- Be able to filter the visible pins on the map for each respective tags (e.g. Fixed Facilties and Local Facilities).
- Be able to help the user navigate to a certain location they want to go to.
- Be able to see information about the facilties selected (e.g. Address, Services Offered, Contact Info).
- Account Creation and being able to pin your own locations.
- and let your UpdiKo Buddy "Buddy" help you navigate through the website.


# Credits
The team behind **`updi-ko`**:
```
Keith Ashly Domingo
John Clyde Aparicio
Mark Leonel Misola
Adriel Neyro Caraig
Christian Jave Hulleza
```


# Logical View Diagram

<img width="6344" height="3352" alt="Logical Diagram for Act 1_ System Architecture Logical Diagram" src="https://github.com/user-attachments/assets/c6238d00-d0c6-418b-b0af-1470aa99321c" />

# Module-Based + Layered Structure

The project currently utilizes a **Module-Based + Layered Architecture Pattern**. In this pattern, each webpage is its own React applet, having its own jsx and css file. This allows each webpage to take responsibility only for its own logic and design. Additionally, this enables the developers to easily add and remove webpages whenever the requirements for the project change.

Besides having its own applet, webpages can freely access assets and components from the system, but the webpages themselves are not connected to each other. Instead, there is a central hub that controls which webpage is being requested by the user. Under this view and logic layer is the service layer, composed of the functions the webpages can then use to talk to the database, which is the bottommost layer. The general project architecture is as follows:

```
[ Central Hub ]
├─ [ Webpages ] → [ Assets and Components ]
----------------------------------------------
│  ├─ [ Service Layer (Data Access) ]
----------------------------------------------
│  │  ├─  [ Database ]
```
## High Level Structure

```
src/
├─ assets/          # global resource
├─ components/      # view layer
├─ pages/           # logic and view layer
├─ services/        # services layer
├─ App.jsx	        # logic layer
```

## Logic and View Layer

```
src/
├─ assets/          # contains image and static data assets
├─ components/      # contains reusable ui components
├─ pages/           # contains website applets
├─ App.jsx	        # responsible for site requests
```

## Services Layer

```
services/
├─ firebase.js      # contains functions that talk to the database
```

## Pages Folder Structure

```
pages/
├─ account/                         # global resource
│  ├─ AccountInfoSection.jsx		# displays user account details
│  ├─ AccountSection.jsx		    # main account page, displays account actions
│  ├─ AccountUpdateSection.jsx	    # interface for account update
├─ auth/     
│  ├─ LoginSection.jsx			    # displays login form and handles user auth
│  ├─ RegisterSection.jsx		    # handles new user registration
├─ home/      
│  ├─ HomeSection.jsx		        # landing page displaying public data and nav actions
├─ map/                             # services layer
│  ├─ MapSection.jsx		        # displays map page and search, creates new pins
│  ├─ PersonalPinSection.jsx	    # displays and manages personal pins
```

## Components Folder Structure

```
components/
├─ map/                        
│  ├─ MapView.jsx		# displays user account details
	                    # main account page, displays account actions
│  ├─ SearchBar.jsx	# search component for public location data
```   

# License
