# DfT Travel Carbon Calculator ✈️🚗🚄

README for Summative One: DfT Travel Carbon Calculator Web App.

**Live Application:** [https://dhi-verma.github.io/travel-carbon-app/](https://dhi-verma.github.io/travel-carbon-app/)

**Figma Design:** Navigate to [Figma Design](https://www.figma.com/design/HC0veTiBJUiM2WAavs45Eg/carbon-web-app-figma-design?m=auto&t=M49Esx0awY1pOrvq-1)

[![CI](https://github.com/dhi-verma/travel-carbon-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dhi-verma/travel-carbon-app/actions)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<details closed><summary>Introduction and Overview</summary>

## Introduction to DfT Travel Carbon Calculator

![Travel Carbon Calculator Interface](docs/carbon-web-app.png)

***Figure One**: Screenshot of the fully deployed Travel Carbon Calculator showing the calculator inputs, results section, and comparison table.*

In Department for Transport, there is focus on reducing the environmental impact of day-to-day operations. One contributor to organisational carbon emissions is business travel. This includes land-based journeys and air travel.

The Government publishes official greenhouse gas (GHG) conversion factors. These are used to estimate carbon emissions. However, applying them correctly can be difficult for non-technical users. It can be time-consuming when users need to compare different travel options quickly. In many cases, these calculations are performed frequently using spreadsheets or external tools.

Another challenge is that different transport modes use different measurement bases. Some factors are measured per vehicle-kilometre. Others are measured per passenger-kilometre. This can lead to confusion or incorrect estimates. Aviation emissions can also include adjustments such as Radiative Forcing (RF). This makes interpretation harder for users who are unfamiliar with environmental reporting standards.

This project aims to address these issues by providing a simple solution. The DfT Travel Carbon Calculator is a web application that estimates carbon dioxide equivalent emissions (kgCO₂e) for land and air travel. Calculations are based on distance, transport type and number of passengers. The application displays both per-person and total journey emissions. Clear explanations are provided so users understand how results are produced.

The main users of this application include analysts, policy teams, and operational staff in DfT. These users often need to make quick, indicative comparisons between different travel options as part of planning, reporting, or decision-making activities. The app provides a simple way to estimate emissions without relying on complex spreadsheets or specialist software.

</details>

<details closed>
<summary>User Documentation</summary>

## User Documentation

The DfT Travel Carbon Calculator is a browser-based tool designed to provide **indicative estimates of carbon emissions (kgCO₂e)** for common business travel scenarios. Users enter journey details and receive both **per-person** and **total** emissions, alongside a short explanation of the calculation basis used.

### Features

The app contains the following features:

* Input distance in kilometres or miles for any journey
* Select from multiple land transport modes: car (petrol, diesel, electric, hybrid, plug-in hybrid), bus (local, coach, London), rail (national, metro, international), or taxi
* Calculate air travel emissions for short, medium, or long-haul flights across economy, premium economy, business, or first class
* View per-person and total group emissions with clear explanation of calculation basis (vehicle-km vs passenger-km)
* Understand radiative forcing (RF) impact for flights, with both with-RF and without-RF values displayed
* Compare multiple travel options side-by-side in a comparison table
* Add and remove trips from comparison to evaluate different journey scenarios
* Input validation with clear error messages for invalid entries

### How to Use the App

1. Select a **Travel Mode** (Land or Air).
2. Enter the **Distance** and choose the unit (kilometres or miles).
3. Enter the **Number of Passengers**.
4. Select the relevant transport option:
   - **Land**: Choose a land type (Car / Bus / Rail / Taxi), then select the specific option.
   - **Air**: Choose flight haul (Short / Medium / Long) and cabin class.
5. Click **Calculate** to display the results.
6. (Optional) Click **Add to comparison** to store the result for side-by-side comparison.

![Deployed App UI](docs/carbon-web-app-test-data.png)

***Figure Two**: Deployed Travel Carbon Calculator interface showing inputs and calculated outputs.*

> **Note:**  
> Flight emissions are displayed **with Radiative Forcing (RF)** by default to reflect full climate impact. A **without-RF** value is also shown for transparency.

</details>
