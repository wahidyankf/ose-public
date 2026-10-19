import com.google.gson.Gson;

public class Deps {
    public static void main(String[] args) {
        System.out.println("deps-ok:" + new Gson().toJson(new int[] {1, 2}));
    }
}
