'use client'

import { useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaSearchLocation } from 'react-icons/fa'

export default function GeofenceMap({ center, radius, onUpdate }) {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [circle, setCircle] = useState(null)
  const [currentCenter, setCurrentCenter] = useState(center)
  const [currentRadius, setCurrentRadius] = useState(radius)

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [])

  useEffect(() => {
    if (map && marker && circle) {
      const newCenter = new window.google.maps.LatLng(center.lat, center.lng)
      marker.setPosition(newCenter)
      circle.setCenter(newCenter)
      circle.setRadius(radius)
      map.setCenter(newCenter)
      setCurrentCenter(center)
      setCurrentRadius(radius)
    }
  }, [center, radius])

  const initMap = () => {
    if (!mapRef.current || !window.google) return

    const initialCenter = { lat: center.lat || 0, lng: center.lng || 0 }

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    })

    // Add marker
    const markerInstance = new window.google.maps.Marker({
      position: initialCenter,
      map: mapInstance,
      draggable: true,
      title: 'Geofence Center',
    })

    // Add circle
    const circleInstance = new window.google.maps.Circle({
      map: mapInstance,
      center: initialCenter,
      radius: radius || 100,
      fillColor: '#3B82F6',
      fillOpacity: 0.2,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      editable: true,
      draggable: false,
    })

    // Update on marker drag
    markerInstance.addListener('dragend', (e) => {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      }
      circleInstance.setCenter(e.latLng)
      setCurrentCenter(newPos)
      onUpdate(newPos, currentRadius)
    })

    // Update on circle radius change
    circleInstance.addListener('radius_changed', () => {
      const newRadius = Math.round(circleInstance.getRadius())
      setCurrentRadius(newRadius)
      onUpdate(currentCenter, newRadius)
    })

    // Click to set center
    mapInstance.addListener('click', (e) => {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      }
      markerInstance.setPosition(e.latLng)
      circleInstance.setCenter(e.latLng)
      setCurrentCenter(newPos)
      onUpdate(newPos, currentRadius)
    })

    setMap(mapInstance)
    setMarker(markerInstance)
    setCircle(circleInstance)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          if (map && marker && circle) {
            const latLng = new window.google.maps.LatLng(newPos.lat, newPos.lng)
            marker.setPosition(latLng)
            circle.setCenter(latLng)
            map.setCenter(latLng)
            setCurrentCenter(newPos)
            onUpdate(newPos, currentRadius)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please set the location manually on the map.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <button
        type="button"
        onClick={getCurrentLocation}
        className="absolute top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors z-10"
        title="Use current location"
      >
        <FaSearchLocation className="text-primary-500" />
        <span className="text-sm font-medium">Use Current Location</span>
      </button>
      <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg px-4 py-2 z-10">
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <FaMapMarkerAlt className="text-primary-500" />
            <span className="font-semibold">Geofence Info</span>
          </div>
          <div>Lat: {currentCenter.lat.toFixed(6)}</div>
          <div>Lng: {currentCenter.lng.toFixed(6)}</div>
          <div>Radius: {currentRadius}m</div>
        </div>
      </div>
    </div>
  )
}

