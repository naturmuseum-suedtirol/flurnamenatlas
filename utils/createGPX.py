import gpxpy.gpx
import csv, datetime, os

gpx = gpxpy.gpx.GPX()
gpx.author_name = "Naturmuseum Südtirol"
gpx.author_link = "https://natura.museum"
gpx.name = "Flurnamenatlas Südtirol"
gpx.time = datetime.datetime.now()

workingDirectory = f"{os.path.dirname(os.path.realpath(__file__))}"
csvFile = f"{workingDirectory}/../namelatlon.csv"
gpxFile = f"{workingDirectory}/../flurnamen.gpx"

with open(csvFile) as csvFileHandle:
    csvReader = csv.reader(csvFileHandle, delimiter=';')
    next(csvReader)
    for row in csvReader:
        name, lon, lat = row
        gpx.waypoints.append(
            gpxpy.gpx.GPXWaypoint(
                latitude = lat,
                longitude = lon,
                name = name
            )
        )

with open(gpxFile, "w") as gpxFileHandle:
    gpxFileHandle.write(gpx.to_xml())