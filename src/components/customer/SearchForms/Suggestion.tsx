// Place this component within StaysSearchForm.tsx or in a separate file
interface SuggestionTextProps {
    suggestion: string;
    query: string;
    isActive: boolean;
}

export const SuggestionText: React.FC<SuggestionTextProps> = ({ suggestion, query, isActive }) => {
    if (!query) return <span>{suggestion}</span>;

    const lowerSuggestion = suggestion.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const startIndex = lowerSuggestion.indexOf(lowerQuery);

    if (startIndex === -1) {
        return <span>{suggestion}</span>;
    }

    const start = suggestion.substring(0, startIndex);
    const match = suggestion.substring(startIndex, startIndex + query.length);
    const end = suggestion.substring(startIndex + query.length);

    // Dynamic classes based on active state
    const matchClass = isActive 
        ? 'font-bold underline decoration-white decoration-2' // White underline/bold when active
        : 'font-bold text-[#003c95]'; // Blue text when not active

    return (
        <p className={`text-base ${isActive ? 'text-white' : 'text-gray-800'}`}>
            <span>{start}</span>
            <span className={matchClass}>{match}</span>
            <span>{end}</span>
        </p>
    );
};

// ... then continue with export default function StaysSearchForm() { ...