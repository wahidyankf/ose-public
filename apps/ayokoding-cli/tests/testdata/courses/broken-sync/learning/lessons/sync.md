# Sync

**`learning/code/ex-01-hello/example.py`**

```python
print("hello")
print("middle")
print("CHANGED")
```

**`learning/code/ex-09-gone/example.py`**

```python
print("gone")
```

**`learning/code/ex-01-hello/example.py#L2-L99`**

```python
print("middle")
```

An anchor with no fence follows:

**`learning/code/ex-01-hello/example.py`**

Prose intervenes, so the anchor above binds no fence.

**`learning/code/ex-01-hello/example.py`**

    ```python
    print("hello")
    print("middle")
    print("world")
    ```

```python
print("fragment")
```

<!-- harness: illustration -->

```python
print("illustrated")
```

**Output**

```text
hello
```

**`learning/code/ex-06-crlf/data.py`**

```python
print("a")
print("b")
```
