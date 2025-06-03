import { Trip } from './assets/core/tripez-io.mjs';
import fs from 'fs/promises';
import path from 'path';

async function main() {
    try {
        // Read trip-1.txt
        const tripTextContent = await fs.readFile('./assets/data-example/trip-1.txt', 'utf-8');
        
        // Parse text to Trip object
        const trip = Trip.fromText(tripTextContent);
        
        // Convert to YAML
        const yamlContent = trip.toYaml();
        
        // Save as trip-1.yaml
        await fs.writeFile('./assets/data-example/trip-1.yaml', yamlContent);
        
        // Read the generated YAML
        const yamlText = await fs.readFile('./assets/data-example/trip-1.yaml', 'utf-8');
        
        // Parse YAML to Trip object
        const tripFromYaml = Trip.fromYaml(yamlText);
        
        // Convert back to text
        const generatedText = tripFromYaml.toText();
        
        // Save as trip-1.generated.txt
        await fs.writeFile('./assets/data-example/trip-1.generated.txt', generatedText);
        
        console.log('Processing completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

main();