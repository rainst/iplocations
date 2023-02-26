import type { MapState } from ".";

interface Props {
  locationsCount: number;
  markersVisible: boolean;
  toggleMarkersVisibility: () => void;
  mapState?: MapState;
}

const MapStatus = ({
  locationsCount,
  markersVisible,
  mapState,
  toggleMarkersVisibility,
}: Props) => (
  <div>
    <button onClick={toggleMarkersVisibility}>
      {markersVisible ? "Hide Locations" : "Show Locations"}
    </button>
    <span>Total locations: {locationsCount}</span>
    {mapState?.boundaries && (
      <div>
        Boundaries: N: {mapState?.boundaries?.north}, S:{" "}
        {mapState?.boundaries?.south}, W:
        {mapState?.boundaries?.west}, E: {mapState?.boundaries?.east}
      </div>
    )}
    <div>
      {mapState?.center && (
        <span>
          Center: {mapState.center.lat}, {mapState.center.lng}
        </span>
      )}
      {mapState?.zoom && <span> Zoom: {mapState.zoom}</span>}
    </div>
  </div>
);

export default MapStatus;
