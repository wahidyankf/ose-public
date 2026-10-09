import java.util.List;
public final class Example17 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => The list’s indexes are 0 and 1.
        // => size() is two, so the valid indexes are zero and one.
        for (int index = 0; index < names.size(); index++) { // => index visits 0, then 1.
        // => The strict less-than bound prevents get(2).
            System.out.println(index + ":" + names.get(index)); // => Each line pairs its zero-based index with its name.
            // => The index is available for both lookup and formatting.
        } // => 0:Ada, then 1:Linus
    }
}
