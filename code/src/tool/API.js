export const fetchIsochroneAndPOIs = async(coord, timeRange, selectedPOIs) => {
	const [lng, lat] = coord;
	console.log(' fetchIsochroneAedPOIs:', lng, lat, coord, timeRange, selectedPOIs);

	fetch('http://localhost:3001/api/isochrone', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			center: { lng, lat },
			time: timeRange,
			selectedPOIs,
		})
	})
		.then(response => response.json())
		.then(data => {
			console.log('Response:', data);
			return data;
		})
		.catch(error => {
			console.error('Error:', error);
		});
};